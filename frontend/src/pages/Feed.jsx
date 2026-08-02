import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import { 
  Heart, 
  MessageCircle, 
  Share2, 
  Image as ImageIcon, 
  Send, 
  Smile, 
  Globe, 
  UserPlus, 
  Trash2,
  Edit2,
  Calendar,
  MapPin,
  Map
} from 'lucide-react';

export default function Feed({ communityId = null }) {
  const { user, getHeaders, followUser } = useAuth();
  const { incomingNotification } = useSocket();
  
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [text, setText] = useState('');
  const [image, setImage] = useState('');
  const [publishing, setPublishing] = useState(false);

  // Recommendations state
  const [recommendations, setRecommendations] = useState([]);
  const [loadingRecs, setLoadingRecs] = useState(true);

  // Active post comments tray
  const [activeCommentsPostId, setActiveCommentsPostId] = useState(null);
  const [comments, setComments] = useState({});
  const [newCommentText, setNewCommentText] = useState('');

  // Fetch Feed
  const fetchFeed = async () => {
    try {
      let url = '/api/posts';
      if (communityId) {
        url += `?community=${communityId}`;
      }
      const res = await fetch(url, { headers: getHeaders() });
      if (res.ok) {
        const data = await res.json();
        
        // Optimistically highlight/place target linked post at the top if present in query parameters
        const params = new URLSearchParams(window.location.search);
        const targetPostId = params.get('post');
        if (targetPostId) {
          const targetPost = data.find(p => p._id === targetPostId);
          if (targetPost) {
            const otherPosts = data.filter(p => p._id !== targetPostId);
            setPosts([targetPost, ...otherPosts]);
            // Open comments for shared post automatically
            setActiveCommentsPostId(targetPostId);
            fetchComments(targetPostId);
          } else {
            setPosts(data);
          }
        } else {
          setPosts(data);
        }
      }
    } catch (err) {
      console.error('Error fetching feed:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchRecommendations = async () => {
    try {
      const res = await fetch('/api/search/recommendations', { headers: getHeaders() });
      if (res.ok) {
        const data = await res.json();
        setRecommendations(data);
      }
    } catch (err) {
      console.error('Error fetching recommendations:', err);
    } finally {
      setLoadingRecs(false);
    }
  };

  useEffect(() => {
    fetchFeed();
    if (!communityId) {
      fetchRecommendations();
    }
  }, [communityId]);

  const handleFollowRec = async (targetId) => {
    try {
      await followUser(targetId);
      // Remove followed user from suggestions list
      setRecommendations(prev => prev.filter(r => r._id !== targetId));
    } catch (err) {
      console.error('Error following recommended user:', err);
    }
  };

  // Read images locally using FileReader (Base64)
  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImage(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  // Publish Post
  const handlePublish = async (e) => {
    e.preventDefault();
    if (!text.trim() && !image) return;

    setPublishing(true);
    try {
      const res = await fetch('/api/posts', {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({
          text,
          image,
          community: communityId
        })
      });

      if (res.ok) {
        const newPost = await res.json();
        setPosts([newPost, ...posts]);
        setText('');
        setImage('');
      }
    } catch (err) {
      console.error('Error publishing post:', err);
    } finally {
      setPublishing(false);
    }
  };

  // Like / Unlike Post (Optimistic snappy updates)
  const handleLike = async (postId) => {
    const originalPosts = [...posts];

    // Toggle locally instantly
    setPosts(prevPosts => prevPosts.map(p => {
      if (p._id === postId) {
        const hasLiked = p.likes?.includes(user?._id);
        const newLikes = hasLiked
          ? p.likes.filter(id => id !== user?._id)
          : [...(p.likes || []), user?._id];
        return { ...p, likes: newLikes };
      }
      return p;
    }));

    try {
      const res = await fetch(`/api/posts/${postId}/like`, {
        method: 'POST',
        headers: getHeaders()
      });

      if (!res.ok) {
        setPosts(originalPosts);
      } else {
        const data = await res.json();
        setPosts(prevPosts => prevPosts.map(p => {
          if (p._id === postId) {
            return { ...p, likes: data.likes };
          }
          return p;
        }));
      }
    } catch (err) {
      console.error('Error liking post:', err);
      setPosts(originalPosts);
    }
  };

  // Fetch comments when tray opens
  const fetchComments = async (postId) => {
    try {
      const res = await fetch(`/api/posts/${postId}/comments`, { headers: getHeaders() });
      if (res.ok) {
        const data = await res.json();
        setComments(prev => ({ ...prev, [postId]: data }));
      }
    } catch (err) {
      console.error('Error fetching comments:', err);
    }
  };

  const toggleComments = (postId) => {
    if (activeCommentsPostId === postId) {
      setActiveCommentsPostId(null);
    } else {
      setActiveCommentsPostId(postId);
      fetchComments(postId);
    }
  };

  // Submit Comment
  const handleAddComment = async (e, postId) => {
    e.preventDefault();
    if (!newCommentText.trim()) return;

    try {
      const res = await fetch(`/api/posts/${postId}/comment`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({ text: newCommentText })
      });

      if (res.ok) {
        const newComment = await res.json();
        setComments(prev => ({
          ...prev,
          [postId]: [...(prev[postId] || []), newComment]
        }));
        setNewCommentText('');
        // Update comments count on post
        setPosts(posts.map(p => {
          if (p._id === postId) {
            return { ...p, commentsCount: (p.commentsCount || 0) + 1 };
          }
          return p;
        }));
      }
    } catch (err) {
      console.error('Error adding comment:', err);
    }
  };

  // Unique link sharing & optimistic count updates
  const handleShare = async (postId) => {
    const shareUrl = `${window.location.origin}/?post=${postId}`;

    try {
      await navigator.clipboard.writeText(shareUrl);
    } catch (err) {
      console.warn('Clipboard write failed, fallback alert:', err);
    }

    const originalPosts = [...posts];

    // Optimistically increment share counts locally
    setPosts(prevPosts => prevPosts.map(p => {
      if (p._id === postId) {
        return { ...p, sharesCount: (p.sharesCount || 0) + 1 };
      }
      return p;
    }));

    // Render snappy non-disruptive Toast alert
    const alertDiv = document.createElement('div');
    alertDiv.className = "fixed bottom-5 right-5 bg-emerald-600 text-white font-bold px-4 py-3 rounded-2xl shadow-xl z-50 text-xs animate-slideInRight";
    alertDiv.innerText = "Unique post link copied to clipboard!";
    document.body.appendChild(alertDiv);
    setTimeout(() => alertDiv.remove(), 2500);

    try {
      const res = await fetch(`/api/posts/${postId}/share`, {
        method: 'POST',
        headers: getHeaders()
      });

      if (!res.ok) {
        setPosts(originalPosts);
      } else {
        const data = await res.json(); // { sharesCount }
        setPosts(prevPosts => prevPosts.map(p => {
          if (p._id === postId) {
            return { ...p, sharesCount: data.sharesCount };
          }
          return p;
        }));
      }
    } catch (err) {
      console.error('Error sharing post:', err);
      setPosts(originalPosts);
    }
  };

  const [editingPost, setEditingPost] = useState(null);
  const [deletingPostId, setDeletingPostId] = useState(null);

  return (
    <div className="max-w-6xl mx-auto py-6 px-4 grid grid-cols-1 lg:grid-cols-3 gap-6 items-start animate-fadeIn">
      {/* Feed Column */}
      <div className="lg:col-span-2 space-y-6">
      
      {/* Publisher Glass Card */}
      {!communityId || (communityId && user) ? (
        <form onSubmit={handlePublish} className="glass-panel rounded-3xl p-5 border border-white/5 relative overflow-hidden">
          <div className="flex gap-3">
            {user?.profilePicture ? (
              <img src={user.profilePicture} alt={user.name} className="w-10 h-10 rounded-full object-cover" />
            ) : (
              <div className="w-10 h-10 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold uppercase">
                {user?.name.charAt(0)}
              </div>
            )}
            <div className="flex-1 space-y-3">
              <textarea
                placeholder={communityId ? "Post to this community..." : "Share what's happening in your local area..."}
                value={text}
                onChange={(e) => setText(e.target.value)}
                rows={3}
                className="w-full bg-transparent border-0 resize-none text-gray-200 placeholder-gray-500 text-sm focus:ring-0 focus:outline-none"
              />
              
              {/* Image Preview */}
              {image && (
                <div className="relative rounded-2xl overflow-hidden border border-white/5 max-h-60 bg-black/40">
                  <img src={image} alt="Preview" className="w-full h-full object-contain" />
                  <button 
                    type="button" 
                    onClick={() => setImage('')}
                    className="absolute top-2.5 right-2.5 p-1.5 bg-[#0b0f17]/80 rounded-full hover:bg-red-500/20 text-gray-300 hover:text-red-400 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              )}

              {/* Publisher Controls */}
              <div className="flex items-center justify-between pt-3 border-t border-white/5">
                <div className="flex items-center gap-2">
                  <label className="p-2 text-gray-400 hover:text-emerald-400 hover:bg-emerald-500/10 rounded-xl cursor-pointer transition-all flex items-center gap-1.5 text-xs font-semibold">
                    <input 
                      type="file" 
                      accept="image/*" 
                      onChange={handleImageChange} 
                      className="hidden" 
                    />
                    <ImageIcon className="w-4 h-4" />
                    <span>Photo</span>
                  </label>
                </div>

                <button
                  type="submit"
                  disabled={publishing || (!text.trim() && !image)}
                  className="bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-bold px-5 py-2 rounded-2xl transition-all text-xs flex items-center gap-1.5 shadow-md shadow-emerald-500/5 hover:-translate-y-0.5"
                >
                  {publishing ? 'Publishing...' : 'Publish'}
                  <Send className="w-3 h-3" />
                </button>
              </div>
            </div>
          </div>
        </form>
      ) : null}

      {/* Feed Stream */}
      {loading ? (
        <div className="text-center py-12">
          <div className="w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-gray-400 text-sm">Loading feed posts...</p>
        </div>
      ) : posts.length === 0 ? (
        <div className="glass-panel rounded-3xl p-12 text-center border border-white/5">
          <Globe className="w-12 h-12 text-gray-500 mx-auto mb-4 animate-pulse-slow" />
          <h3 className="text-lg font-bold text-gray-300 mb-1">No Posts Yet</h3>
          <p className="text-gray-500 text-sm">Be the first to share local updates and announcements!</p>
        </div>
      ) : (
        <div className="space-y-4">
          {posts.map((post) => {
            const hasLiked = post.likes?.includes(user?._id);
            const isCommentsOpen = activeCommentsPostId === post._id;

            console.log("Post owner debug:", {
              postId: post._id,
              postText: post.text?.substring(0, 20),
              postUserId: post.user?._id || post.user,
              currentUserId: user?._id,
              isMatch: (post.user?._id || post.user) === user?._id
            });

            return (
              <div key={post._id} className="glass-panel rounded-3xl p-5 border border-white/5 flex flex-col gap-4">
                
                {/* Post Author Info (Clickable Link to Profile) */}
                <div className="flex items-center justify-between">
                  <Link to={`/profile/${post.user?._id || post.user}`} className="flex items-center gap-3 group">
                    {post.user?.profilePicture ? (
                      <img src={post.user.profilePicture} alt={post.user.name} className="w-10 h-10 rounded-full object-cover group-hover:opacity-85 transition-opacity" />
                    ) : (
                      <div className="w-10 h-10 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold uppercase text-sm group-hover:scale-105 transition-transform">
                        {post.user?.name ? post.user.name.charAt(0) : 'U'}
                      </div>
                    )}
                    <div>
                      <h4 className="font-bold text-gray-200 text-sm group-hover:underline cursor-pointer">{post.user?.name}</h4>
                      <p className="text-xs text-gray-500 flex items-center gap-1">
                        {post.user?.university && <span>{post.user.university} • </span>}
                        {post.user?.district && <span>{post.user.district} • </span>}
                        <span>{new Date(post.createdAt).toLocaleDateString()}</span>
                      </p>
                    </div>
                  </Link>

                  {/* Edit/Delete Actions for Post Owner */}
                  {((post.user?._id || post.user) === user?._id) && (
                    <div className="flex items-center gap-1.5 shrink-0">
                       <button 
                        onClick={() => setEditingPost({ _id: post._id, text: post.text })}
                        className="p-2 hover:bg-emerald-500/10 hover:text-emerald-400 rounded-xl text-gray-500 transition-all cursor-pointer"
                        title="Edit Post"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button 
                        onClick={() => setDeletingPostId(post._id)}
                        className="p-2 hover:bg-red-500/10 hover:text-red-400 rounded-xl text-gray-500 transition-all cursor-pointer"
                        title="Delete Post"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                </div>

                {/* Post Content */}
                {post.text && (
                  <p className="text-gray-300 text-sm leading-relaxed whitespace-pre-wrap">
                    {post.text}
                  </p>
                )}

                {post.image && (
                  <div className="rounded-2xl overflow-hidden border border-white/5 bg-black/20 max-h-96 flex items-center justify-center">
                    <img src={post.image} alt="Post Attachment" className="w-full h-full object-cover" />
                  </div>
                )}

                {/* Interaction Toolbar */}
                <div className="flex items-center justify-between pt-2 border-t border-white/5 text-gray-400 text-xs">
                  <button 
                    onClick={() => handleLike(post._id)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl hover:bg-white/5 transition-all ${
                      hasLiked ? 'text-red-500 font-bold bg-red-500/5' : 'hover:text-white'
                    }`}
                  >
                    <Heart className={`w-4 h-4 ${hasLiked ? 'fill-current' : ''}`} />
                    <span>{post.likes?.length || 0} Likes</span>
                  </button>

                  <button 
                    onClick={() => toggleComments(post._id)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl hover:bg-white/5 hover:text-white transition-all ${
                      isCommentsOpen ? 'text-emerald-400 bg-emerald-500/5 font-bold' : ''
                    }`}
                  >
                    <MessageCircle className="w-4 h-4" />
                    <span>{post.commentsCount || 0} Comments</span>
                  </button>

                  <button 
                    onClick={() => handleShare(post._id)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl hover:bg-white/5 hover:text-white transition-all"
                  >
                    <Share2 className="w-4 h-4" />
                    <span>{post.sharesCount || 0} Shares</span>
                  </button>
                </div>

                {/* Comments Drawer */}
                {isCommentsOpen && (
                  <div className="mt-2 pt-4 border-t border-white/5 space-y-4 animate-fadeIn">
                    
                    {/* Add Comment Form */}
                    <form onSubmit={(e) => handleAddComment(e, post._id)} className="flex gap-2">
                      <input
                        type="text"
                        placeholder="Write a comment..."
                        value={newCommentText}
                        onChange={(e) => setNewCommentText(e.target.value)}
                        className="flex-1 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl px-4 py-2 text-xs focus:outline-none focus:border-emerald-500/50 text-gray-800 dark:text-gray-200"
                      />
                      <button
                        type="submit"
                        className="bg-emerald-600/20 hover:bg-emerald-600 text-emerald-400 hover:text-white font-bold p-2.5 rounded-2xl transition-colors"
                      >
                        <Send className="w-3.5 h-3.5" />
                      </button>
                    </form>

                    {/* Comments List */}
                    <div className="space-y-3 max-h-60 overflow-y-auto pr-1">
                      {!(comments[post._id]) ? (
                        <p className="text-center text-xs text-gray-500 py-2">Loading comments...</p>
                      ) : comments[post._id].length === 0 ? (
                        <p className="text-center text-xs text-gray-500 py-2">No comments yet. Write something!</p>
                      ) : (
                        comments[post._id].map((c) => (
                          <div key={c._id} className="flex gap-2.5 items-start p-2 bg-gray-50 dark:bg-gray-900/40 rounded-2xl border border-gray-100 dark:border-gray-800/50">
                            {c.user?.profilePicture ? (
                              <img src={c.user.profilePicture} alt={c.user.name} className="w-6.5 h-6.5 rounded-full object-cover" />
                            ) : (
                              <div className="w-6.5 h-6.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold text-[10px] uppercase">
                                {c.user?.name ? c.user.name.charAt(0) : 'U'}
                              </div>
                            )}
                            <div className="flex-1">
                              <div className="flex items-center justify-between">
                                <span className="font-bold text-gray-300 text-xs">{c.user?.name}</span>
                                <span className="text-[10px] text-gray-500">{new Date(c.createdAt).toLocaleDateString()}</span>
                              </div>
                              <p className="text-gray-400 text-xs mt-0.5">{c.text}</p>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                )}

              </div>
            );
          })}
        </div>
      )}

      {/* Custom Edit Post Modal */}
      {editingPost && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fadeIn">
          <div className="glass-panel rounded-3xl w-full max-w-md p-6 border border-white/10 relative animate-scaleIn">
            <h3 className="text-lg font-extrabold text-white mb-4">Edit Publication</h3>
            <textarea
              value={editingPost.text}
              onChange={(e) => setEditingPost({ ...editingPost, text: e.target.value })}
              rows={4}
              className="w-full bg-[#111827] border border-white/10 rounded-2xl p-4 text-sm text-gray-200 focus:outline-none focus:border-emerald-500/50"
              placeholder="What's on your mind?"
            />
            <div className="flex justify-end gap-3 mt-4">
              <button
                onClick={() => setEditingPost(null)}
                className="bg-white/5 hover:bg-white/10 text-gray-400 font-bold px-4 py-2 rounded-xl border border-white/5 text-xs transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={async () => {
                  try {
                    const res = await fetch(`/api/posts/${editingPost._id}`, {
                      method: 'PUT',
                      headers: getHeaders(),
                      body: JSON.stringify({ text: editingPost.text })
                    });

                    if (res.ok) {
                      const updated = await res.json();
                      setPosts(posts.map(p => p._id === editingPost._id ? { ...p, text: updated.text } : p));
                      setEditingPost(null);
                    } else {
                      const data = await res.json();
                      alert(data.message || 'Failed to update post');
                    }
                  } catch (err) {
                    console.error(err);
                  }
                }}
                className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold px-5 py-2 rounded-xl text-xs transition-colors cursor-pointer"
              >
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Custom Delete Post Modal */}
      {deletingPostId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fadeIn">
          <div className="glass-panel rounded-3xl w-full max-w-sm p-6 border border-white/10 relative animate-scaleIn text-center space-y-4">
            <div className="w-12 h-12 rounded-full bg-red-500/10 border border-red-500/20 text-red-400 flex items-center justify-center mx-auto">
              <Trash2 className="w-6 h-6 animate-bounce" />
            </div>
            <div>
              <h3 className="text-base font-extrabold text-white">Delete Publication?</h3>
              <p className="text-xs text-gray-400 mt-1">This action cannot be undone. Are you sure you want to delete this post?</p>
            </div>
            <div className="flex gap-3 pt-2 justify-center">
              <button
                onClick={() => setDeletingPostId(null)}
                className="bg-white/5 hover:bg-white/10 text-gray-400 font-bold px-4 py-2 rounded-xl border border-white/5 text-xs transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={async () => {
                  try {
                    const res = await fetch(`/api/posts/${deletingPostId}`, {
                      method: 'DELETE',
                      headers: getHeaders()
                    });

                    if (res.ok) {
                      setPosts(posts.filter(p => p._id !== deletingPostId));
                      setDeletingPostId(null);
                    } else {
                      const data = await res.json();
                      alert(data.message || 'Failed to delete post');
                    }
                  } catch (err) {
                    console.error(err);
                  }
                }}
                className="bg-red-600 hover:bg-red-500 text-white font-bold px-5 py-2 rounded-xl text-xs transition-colors cursor-pointer"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
      </div>

      {/* Suggested Friends Sidebar */}
      {!communityId && (
        <div className="hidden lg:block space-y-6 sticky top-24 animate-fadeIn">
          <div className="glass-panel rounded-3xl p-5 border border-slate-200 dark:border-white/5 space-y-4">
            <h3 className="text-sm font-extrabold uppercase tracking-wider text-slate-500 dark:text-gray-400">Suggested Friends</h3>
            {loadingRecs ? (
              <p className="text-xs text-gray-500 py-2">Loading suggestions...</p>
            ) : recommendations.length === 0 ? (
              <p className="text-xs text-gray-500 py-2">No recommendations active. You followed everyone nearby!</p>
            ) : (
              <div className="space-y-3.5">
                {recommendations.map((rec) => (
                  <div key={rec._id} className="flex items-center justify-between gap-2.5">
                    <div className="flex items-center gap-2.5 min-w-0">
                      {rec.profilePicture ? (
                        <img src={rec.profilePicture} alt={rec.name} className="w-8 h-8 rounded-full object-cover shrink-0" />
                      ) : (
                        <div className="w-8 h-8 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-extrabold text-[10px] uppercase shrink-0">
                          {rec.name.charAt(0)}
                        </div>
                      )}
                      <div className="min-w-0">
                        <Link to={`/profile/${rec._id}`} className="text-xs font-bold text-slate-800 dark:text-gray-200 hover:underline truncate block">
                          {rec.name}
                        </Link>
                        <p className="text-[9px] text-gray-400 truncate">
                          {rec.university || rec.district || 'Vibora Citizen'}
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => handleFollowRec(rec._id)}
                      className="bg-emerald-600/10 hover:bg-emerald-600 text-emerald-600 dark:text-emerald-400 hover:text-white border border-emerald-500/20 font-bold px-3 py-1 rounded-xl text-[9px] flex items-center gap-1 transition-colors cursor-pointer"
                    >
                      <UserPlus className="w-3 h-3" />
                      <span>Follow</span>
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
