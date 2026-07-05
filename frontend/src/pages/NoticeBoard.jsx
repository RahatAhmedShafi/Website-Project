import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { 
  Megaphone, 
  MapPin, 
  Plus, 
  Trash2, 
  Edit2,
  ImageIcon, 
  Calendar,
  AlertTriangle,
  Gift,
  HelpCircle,
  Check,
  Heart,
  MessageCircle,
  X
} from 'lucide-react';

export default function NoticeBoard() {
  const { user, getHeaders } = useAuth();
  
  const [notices, setNotices] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Notice filter categories
  const [activeCategory, setActiveCategory] = useState(''); // Empty means all

  // Form creation states
  const [createOpen, setCreateOpen] = useState(false);
  const [text, setText] = useState('');
  const [image, setImage] = useState('');
  const [noticeCategory, setNoticeCategory] = useState('Announcement'); // Announcement, Event, Lost & Found
  const [publishing, setPublishing] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');

  const categories = ['Announcement', 'Event', 'Lost & Found'];

  const fetchNotices = async () => {
    try {
      setLoading(true);
      let url = '/api/posts?isNotice=true';
      if (activeCategory) {
        url += `&noticeCategory=${encodeURIComponent(activeCategory)}`;
      }

      const res = await fetch(url, { headers: getHeaders() });
      if (res.ok) {
        const data = await res.json();
        setNotices(data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotices();
  }, [activeCategory]);

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

  const handlePublish = async (e) => {
    e.preventDefault();
    if (!text.trim()) return;

    setPublishing(true);
    setError('');

    try {
      const res = await fetch('/api/posts', {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({
          text,
          image,
          isNotice: true,
          noticeCategory
        })
      });

      if (res.ok) {
        const newNotice = await res.json();
        setNotices([newNotice, ...notices]);
        setText('');
        setImage('');
        setCreateOpen(false);
        setSuccess('Notice published successfully!');
        setTimeout(() => setSuccess(''), 3000);
      } else {
        const data = await res.json();
        setError(data.message || 'Failed to post notice');
      }
    } catch (err) {
      console.error(err);
      setError('Connection failure');
    } finally {
      setPublishing(false);
    }
  };

  const [editingNotice, setEditingNotice] = useState(null);
  const [deletingNoticeId, setDeletingNoticeId] = useState(null);

  const getCategoryColor = (cat) => {
    switch (cat) {
      case 'Announcement': return 'bg-amber-500/10 border-amber-500/20 text-amber-400';
      case 'Event': return 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400';
      case 'Lost & Found': return 'bg-red-500/10 border-red-500/20 text-red-400';
      default: return 'bg-gray-500/10 border-gray-500/20 text-gray-400';
    }
  };

  const getCategoryIcon = (cat) => {
    switch (cat) {
      case 'Announcement': return <Megaphone className="w-4 h-4" />;
      case 'Event': return <Calendar className="w-4 h-4" />;
      case 'Lost & Found': return <AlertTriangle className="w-4 h-4" />;
      default: return <HelpCircle className="w-4 h-4" />;
    }
  };

  return (
    <div className="max-w-4xl mx-auto py-8 px-4 space-y-6">
      
      {success && (
        <div className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-sm rounded-2xl px-4 py-3 flex items-center gap-2">
          <Check className="w-4 h-4" />
          <span>{success}</span>
        </div>
      )}

      {/* Hero */}
      <div className="glass-panel rounded-3xl p-6 border border-white/5 bg-gradient-to-r from-amber-950/20 via-slate-900 to-[#111827] flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="space-y-2">
          <h2 className="text-2xl font-black text-white flex items-center gap-2">
            <Megaphone className="w-6 h-6 text-amber-400 animate-pulse" />
            <span>Local Notice Board</span>
          </h2>
          <p className="text-gray-400 text-sm max-w-xl">
            Keep up with community notices, lost and found listings, and local event invitations. Filter category postings below.
          </p>
        </div>

        <button
          onClick={() => setCreateOpen(true)}
          className="bg-amber-600 hover:bg-amber-500 text-white font-bold py-2.5 px-4 rounded-2xl text-xs flex items-center gap-1.5 transition-colors shadow-lg shadow-amber-500/10"
        >
          <Plus className="w-4.5 h-4.5" />
          <span>Publish Notice</span>
        </button>
      </div>

      {/* Navigation Filters */}
      <div className="flex border-b border-white/5 gap-2">
        <button
          onClick={() => setActiveCategory('')}
          className={`pb-3 px-4 text-xs font-bold border-b-2 transition-all ${
            activeCategory === ''
              ? 'border-amber-500 text-amber-400'
              : 'border-transparent text-gray-400 hover:text-gray-200'
          }`}
        >
          All Notices
        </button>
        {categories.map(cat => (
          <button
            key={cat}
            onClick={() => setActiveCategory(cat)}
            className={`pb-3 px-4 text-xs font-bold border-b-2 transition-all ${
              activeCategory === cat
                ? 'border-amber-500 text-amber-400'
                : 'border-transparent text-gray-400 hover:text-gray-200'
            }`}
          >
            {cat}s
          </button>
        ))}
      </div>

      {/* Notices Stream */}
      {loading ? (
        <div className="text-center py-20">
          <div className="w-8 h-8 border-2 border-amber-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-gray-400 text-sm">Loading notices...</p>
        </div>
      ) : notices.length === 0 ? (
        <div className="glass-panel rounded-3xl p-12 text-center border border-white/5 text-gray-500 text-sm">
          No active notices listed on the board.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {notices.map((notice) => (
            <div 
              key={notice._id}
              className="glass-panel rounded-3xl p-5 border border-white/5 flex flex-col justify-between gap-4"
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    {notice.user?.profilePicture ? (
                      <img src={notice.user.profilePicture} alt={notice.user.name} className="w-6.5 h-6.5 rounded-full object-cover" />
                    ) : (
                      <div className="w-6.5 h-6.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold text-[10px] uppercase">
                        {notice.user?.name ? notice.user.name.charAt(0) : 'U'}
                      </div>
                    )}
                    <div>
                      <h4 className="font-bold text-gray-300 text-xs">{notice.user?.name}</h4>
                      <p className="text-[9px] text-gray-500">{new Date(notice.createdAt).toLocaleDateString()}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className={`flex items-center gap-1 border px-2 py-0.5 rounded-lg text-[9px] font-bold ${getCategoryColor(notice.noticeCategory)}`}>
                      {getCategoryIcon(notice.noticeCategory)}
                      <span>{notice.noticeCategory}</span>
                    </span>

                    {/* Edit/Delete Actions for Notice Owner */}
                    {((notice.user?._id || notice.user) === user?._id) && (
                      <div className="flex items-center gap-1 shrink-0 ml-1">
                        <button 
                          onClick={() => setEditingNotice({ _id: notice._id, text: notice.text })}
                          className="p-1 hover:bg-amber-500/10 hover:text-amber-400 rounded-lg text-gray-500 transition-all cursor-pointer"
                          title="Edit Notice"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button 
                          onClick={() => setDeletingNoticeId(notice._id)}
                          className="p-1 hover:bg-red-500/10 hover:text-red-400 rounded-lg text-gray-500 transition-all cursor-pointer"
                          title="Delete Notice"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                <p className="text-gray-300 text-xs leading-relaxed whitespace-pre-wrap">
                  {notice.text}
                </p>

                {notice.image && (
                  <div className="rounded-xl overflow-hidden border border-white/5 bg-black/10 max-h-48 flex items-center justify-center">
                    <img src={notice.image} alt="Notice banner" className="w-full h-full object-cover" />
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Creation Modal */}
      {createOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="glass-panel rounded-3xl w-full max-w-md p-6 border border-white/10 relative animate-scaleIn max-h-[90vh] overflow-y-auto">
            <button 
              onClick={() => setCreateOpen(false)}
              className="absolute top-4 right-4 p-2 bg-[#111827] border border-white/5 rounded-full hover:bg-white/5 text-gray-400 hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>

            <h3 className="text-lg font-extrabold text-white mb-4 flex items-center gap-2">
              <Megaphone className="w-5 h-5 text-amber-500" />
              <span>Draft a Local Notice</span>
            </h3>

            {error && (
              <div className="mb-4 bg-red-500/10 border border-red-500/20 text-red-400 text-xs rounded-xl px-4 py-2.5">
                {error}
              </div>
            )}

            <form onSubmit={handlePublish} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-gray-400 mb-1.5">
                  Notice Category
                </label>
                <select
                  value={noticeCategory}
                  onChange={(e) => setNoticeCategory(e.target.value)}
                  className="w-full bg-[#111827] border border-white/10 rounded-2xl py-2.5 px-4 text-xs text-gray-400 focus:text-gray-200 focus:outline-none"
                >
                  {categories.map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-gray-400 mb-1.5">
                  Notice Message
                </label>
                <textarea
                  required
                  placeholder="e.g. Lost keys near BUET campus library, or Announcement for local cricket event..."
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  rows={4}
                  className="w-full bg-[#111827] border border-white/10 rounded-2xl py-2.5 px-4 text-xs text-gray-200 focus:outline-none resize-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-gray-400 mb-1.5">
                  Photo Attachment (Optional)
                </label>
                <div className="flex items-center gap-4">
                  {image ? (
                    <img src={image} alt="Preview" className="w-16 h-16 rounded-xl object-cover bg-slate-900 border border-white/5" />
                  ) : (
                    <div className="w-16 h-16 rounded-xl bg-[#111827] border border-white/5 flex items-center justify-center text-gray-600">
                      <Megaphone className="w-6 h-6" />
                    </div>
                  )}
                  <label className="bg-[#1f2937] hover:bg-[#374151] border border-white/5 text-gray-300 font-semibold px-4 py-2 rounded-xl text-xs cursor-pointer flex items-center gap-1.5">
                    <ImageIcon className="w-4 h-4" />
                    <span>Upload Image</span>
                    <input type="file" accept="image/*" onChange={handleImageChange} className="hidden" />
                  </label>
                  {image && (
                    <button 
                      type="button" 
                      onClick={() => setImage('')}
                      className="text-xs text-red-400 font-semibold hover:underline"
                    >
                      Remove
                    </button>
                  )}
                </div>
              </div>

              <div className="flex gap-2 justify-end pt-4 border-t border-white/5">
                <button
                  type="button"
                  onClick={() => setCreateOpen(false)}
                  className="bg-[#1f2937] hover:bg-[#374151] text-gray-300 font-semibold px-4 py-2 rounded-2xl text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={publishing}
                  className="bg-amber-600 hover:bg-amber-500 text-white font-bold px-5 py-2 rounded-2xl text-xs"
                >
                  {publishing ? 'Publishing...' : 'Publish'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Custom Edit Notice Modal */}
      {editingNotice && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fadeIn">
          <div className="glass-panel rounded-3xl w-full max-w-md p-6 border border-white/10 relative animate-scaleIn">
            <h3 className="text-lg font-extrabold text-white mb-4">Edit Notice</h3>
            <textarea
              value={editingNotice.text}
              onChange={(e) => setEditingNotice({ ...editingNotice, text: e.target.value })}
              rows={4}
              className="w-full bg-[#111827] border border-white/10 rounded-2xl p-4 text-sm text-gray-200 focus:outline-none focus:border-amber-500/50"
              placeholder="Notice content..."
            />
            <div className="flex justify-end gap-3 mt-4">
              <button
                onClick={() => setEditingNotice(null)}
                className="bg-white/5 hover:bg-white/10 text-gray-400 font-bold px-4 py-2 rounded-xl border border-white/5 text-xs transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={async () => {
                  try {
                    const res = await fetch(`/api/posts/${editingNotice._id}`, {
                      method: 'PUT',
                      headers: getHeaders(),
                      body: JSON.stringify({ text: editingNotice.text })
                    });

                    if (res.ok) {
                      const updated = await res.json();
                      setNotices(notices.map(n => n._id === editingNotice._id ? { ...n, text: updated.text } : n));
                      setEditingNotice(null);
                    } else {
                      const data = await res.json();
                      alert(data.message || 'Failed to update notice');
                    }
                  } catch (err) {
                    console.error(err);
                  }
                }}
                className="bg-amber-600 hover:bg-amber-500 text-white font-bold px-5 py-2 rounded-xl text-xs transition-colors cursor-pointer"
              >
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Custom Delete Notice Modal */}
      {deletingNoticeId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fadeIn">
          <div className="glass-panel rounded-3xl w-full max-w-sm p-6 border border-white/10 relative animate-scaleIn text-center space-y-4">
            <div className="w-12 h-12 rounded-full bg-red-500/10 border border-red-500/20 text-red-400 flex items-center justify-center mx-auto">
              <Trash2 className="w-6 h-6 animate-bounce" />
            </div>
            <div>
              <h3 className="text-base font-extrabold text-white">Delete Notice?</h3>
              <p className="text-xs text-gray-400 mt-1">This action cannot be undone. Are you sure you want to delete this notice?</p>
            </div>
            <div className="flex gap-3 pt-2 justify-center">
              <button
                onClick={() => setDeletingNoticeId(null)}
                className="bg-white/5 hover:bg-white/10 text-gray-400 font-bold px-4 py-2 rounded-xl border border-white/5 text-xs transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={async () => {
                  try {
                    const res = await fetch(`/api/posts/${deletingNoticeId}`, {
                      method: 'DELETE',
                      headers: getHeaders()
                    });

                    if (res.ok) {
                      setNotices(notices.filter(n => n._id !== deletingNoticeId));
                      setDeletingNoticeId(null);
                    } else {
                      const data = await res.json();
                      alert(data.message || 'Failed to delete notice');
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
  );
}
