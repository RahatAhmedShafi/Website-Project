import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { 
  User, 
  School, 
  MapPin, 
  Award, 
  Edit2, 
  Mail, 
  MessageCircle, 
  Plus, 
  X, 
  Check, 
  Camera,
  Trash2,
  Lock,
  UserPlus
} from 'lucide-react';

export default function Profile() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user: currentUser, getHeaders, updateProfile, followUser, sendFriendRequest, acceptFriendRequest, declineFriendRequest, unfriendUser } = useAuth();
  
  // Target profile user ID (default to current user if no parameter matches)
  const profileId = id || currentUser?._id;
  const isOwnProfile = profileId === currentUser?._id;

  const [userProfile, setUserProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Editing form states
  const [editName, setEditName] = useState('');
  const [editUni, setEditUni] = useState('');
  const [editDistrict, setEditDistrict] = useState('');
  const [editBio, setEditBio] = useState('');
  const [editSkills, setEditSkills] = useState([]);
  const [newSkillText, setNewSkillText] = useState('');
  const [editPic, setEditPic] = useState('');

  // Post history states
  const [userPosts, setUserPosts] = useState([]);

  // Districts for select
  const districts = [
    'Dhaka', 'Chittagong', 'Sylhet', 'Rajshahi', 'Khulna', 'Barisal', 'Rangpur', 'Mymensingh',
    'Comilla', 'Narayanganj', 'Gazipur', 'Bograt', 'Cox\'s Bazar', 'Feni', 'Jessore'
  ];

  const fetchProfile = async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/auth/users/${profileId}`, { headers: getHeaders() });
      if (res.ok) {
        const data = await res.json();
        setUserProfile(data);

        // Prep editing state
        setEditName(data.name || '');
        setEditUni(data.university || '');
        setEditDistrict(data.district || '');
        setEditBio(data.bio || '');
        setEditSkills(data.skills || []);
        setEditPic(data.profilePicture || '');
      } else {
        setError('Failed to fetch user profile');
      }
    } catch (err) {
      console.error(err);
      setError('Error loading profile');
    } finally {
      setLoading(false);
    }
  };

  const fetchUserPosts = async () => {
    try {
      const res = await fetch('/api/posts', { headers: getHeaders() });
      if (res.ok) {
        const posts = await res.json();
        // Filter posts owned by this user profile
        const filtered = posts.filter(p => {
          const pUserId = typeof p.user === 'object' ? p.user._id : p.user;
          return pUserId === profileId;
        });
        setUserPosts(filtered);
      }
    } catch (err) {
      console.error('Error fetching user post history:', err);
    }
  };

  useEffect(() => {
    if (profileId) {
      fetchProfile();
      fetchUserPosts();
    }
  }, [profileId]);

  // Handle image conversion to Base64
  const handlePicChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setEditPic(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  // Add skill to temporary list
  const handleAddSkill = (e) => {
    e.preventDefault();
    if (newSkillText.trim() && !editSkills.includes(newSkillText.trim())) {
      setEditSkills([...editSkills, newSkillText.trim()]);
      setNewSkillText('');
    }
  };

  const handleRemoveSkill = (skillToRemove) => {
    setEditSkills(editSkills.filter(s => s !== skillToRemove));
  };

  // Save profile changes
  const handleSave = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    try {
      const updated = await updateProfile({
        name: editName,
        university: editUni,
        district: editDistrict,
        bio: editBio,
        skills: editSkills,
        profilePicture: editPic
      });
      setUserProfile(updated);
      setIsEditing(false);
      setSuccess('Profile updated successfully!');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.message || 'Failed to update profile');
    }
  };

  // Toggle Follow
  const handleFollowToggle = async () => {
    try {
      const followed = await followUser(profileId);
      // Reload profile
      fetchProfile();
    } catch (err) {
      console.error(err);
    }
  };

  const handleFriendRequest = async () => {
    try {
      await sendFriendRequest(profileId);
      fetchProfile();
    } catch (err) {
      console.error(err);
    }
  };

  const handleAcceptFriend = async () => {
    try {
      await acceptFriendRequest(profileId);
      fetchProfile();
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeclineFriend = async () => {
    try {
      await declineFriendRequest(profileId);
      fetchProfile();
    } catch (err) {
      console.error(err);
    }
  };

  const handleUnfriend = async () => {
    if (window.confirm("Are you sure you want to remove this friend?")) {
      try {
        await unfriendUser(profileId);
        fetchProfile();
      } catch (err) {
        console.error(err);
      }
    }
  };

  if (loading) {
    return (
      <div className="text-center py-24">
        <div className="w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
        <p className="text-gray-400 text-sm">Loading user profile...</p>
      </div>
    );
  }

  if (error || !userProfile) {
    return (
      <div className="max-w-md mx-auto text-center py-20 px-4">
        <p className="text-red-400 bg-red-500/10 border border-red-500/20 px-4 py-3 rounded-2xl text-sm">{error || 'Profile not found.'}</p>
      </div>
    );
  }

  const isFollowing = currentUser?.following?.includes(profileId);
  const isFriend = currentUser?.friends?.includes(profileId);
  const hasSentRequest = currentUser?.sentFriendRequests?.includes(profileId);
  const hasIncomingRequest = currentUser?.friendRequests?.includes(profileId);

  return (
    <div className="max-w-4xl mx-auto py-8 px-4 space-y-6">
      
      {success && (
        <div className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-sm rounded-2xl px-4 py-3 flex items-center gap-2">
          <Check className="w-4 h-4" />
          <span>{success}</span>
        </div>
      )}

      {/* Main Profile Cover & Hero Card */}
      <div className="glass-panel rounded-3xl overflow-hidden border border-white/5 relative">
        {/* Colorful top Banner block */}
        <div className="h-32 sm:h-44 bg-gradient-to-r from-emerald-800 to-emerald-950 opacity-80" />

        <div className="px-6 pb-6 relative flex flex-col sm:flex-row gap-5 items-start sm:items-end -mt-16 sm:-mt-20">
          {/* Avatar frame */}
          <div className="relative">
            {userProfile.profilePicture ? (
              <img 
                src={userProfile.profilePicture} 
                alt={userProfile.name} 
                className="w-28 h-28 sm:w-36 sm:h-36 rounded-2xl border-4 border-[#0b0f17] object-cover bg-slate-900" 
              />
            ) : (
              <div className="w-28 h-28 sm:w-36 sm:h-36 rounded-2xl border-4 border-[#0b0f17] bg-[#111827] text-emerald-400 flex items-center justify-center font-bold text-4xl uppercase">
                {userProfile.name.charAt(0)}
              </div>
            )}
          </div>

          {/* User title headers */}
          <div className="flex-1 space-y-1 pb-2">
            <h2 className="text-2xl sm:text-3xl font-extrabold text-white">{userProfile.name}</h2>
            <div className="flex flex-wrap gap-x-4 gap-y-1.5 text-xs sm:text-sm text-gray-400">
              {userProfile.university && (
                <span className="flex items-center gap-1.5"><School className="w-4 h-4 text-emerald-400" /> {userProfile.university}</span>
              )}
              {userProfile.district && (
                <span className="flex items-center gap-1.5"><MapPin className="w-4 h-4 text-emerald-400" /> {userProfile.district}</span>
              )}
            </div>
            {/* Followers count bar */}
            <div className="flex gap-4 text-xs font-semibold text-gray-500 pt-2">
              <span>{userProfile.followers?.length || 0} Followers</span>
              <span>{userProfile.following?.length || 0} Following</span>
            </div>
          </div>

          {/* Action buttons */}
          <div className="w-full sm:w-auto flex gap-2 items-center">
            {isOwnProfile ? (
              <button 
                onClick={() => setIsEditing(true)} 
                className="w-full sm:w-auto bg-[#1f2937] hover:bg-[#374151] text-gray-200 border border-white/5 font-semibold px-5 py-2.5 rounded-2xl text-xs flex items-center justify-center gap-1.5 transition-colors"
              >
                <Edit2 className="w-4 h-4" />
                <span>Edit Profile</span>
              </button>
            ) : (
              <>
                {/* Friend Actions */}
                {isFriend ? (
                  <button 
                    onClick={handleUnfriend} 
                    className="flex-1 sm:flex-none font-bold px-5 py-2.5 rounded-2xl text-xs flex items-center justify-center gap-1.5 transition-all bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 hover:bg-red-500/10 hover:border-red-500/30 hover:text-red-400 group"
                  >
                    <span className="group-hover:hidden">Friends ✓</span>
                    <span className="hidden group-hover:inline">Unfriend</span>
                  </button>
                ) : hasSentRequest ? (
                  <button 
                    onClick={handleFriendRequest} 
                    className="flex-1 sm:flex-none font-bold px-5 py-2.5 rounded-2xl text-xs flex items-center justify-center gap-1.5 transition-all bg-white/5 border border-white/10 text-gray-400 hover:border-red-500/30 hover:text-red-400 group"
                  >
                    <span className="group-hover:hidden">Request Sent</span>
                    <span className="hidden group-hover:inline">Cancel Request</span>
                  </button>
                ) : hasIncomingRequest ? (
                  <div className="flex gap-1.5 flex-1 sm:flex-none">
                    <button 
                      onClick={handleAcceptFriend} 
                      className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold px-4 py-2.5 rounded-2xl text-xs transition-colors shrink-0"
                    >
                      Accept
                    </button>
                    <button 
                      onClick={handleDeclineFriend} 
                      className="bg-red-600/20 hover:bg-red-600/30 border border-red-500/20 text-red-400 font-bold px-4 py-2.5 rounded-2xl text-xs transition-colors shrink-0"
                    >
                      Decline
                    </button>
                  </div>
                ) : (
                  <button 
                    onClick={handleFriendRequest} 
                    className="flex-1 sm:flex-none font-bold px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white shadow-md shadow-emerald-500/10 rounded-2xl text-xs flex items-center justify-center gap-1.5 transition-all"
                  >
                    <UserPlus className="w-4 h-4" />
                    <span>Add Friend</span>
                  </button>
                )}

                {/* Follow Button */}
                <button 
                  onClick={handleFollowToggle} 
                  className={`px-4 py-2.5 rounded-2xl text-xs font-semibold border transition-all ${
                    isFollowing 
                      ? 'bg-transparent border-emerald-500/20 text-emerald-400' 
                      : 'bg-[#1f2937] border-white/5 text-gray-300 hover:bg-[#374151]'
                  }`}
                >
                  {isFollowing ? 'Following' : 'Follow'}
                </button>

                {/* Chat Bubble Icon */}
                <button 
                  onClick={() => navigate(`/chat?userId=${profileId}`)}
                  className="p-2.5 bg-[#1f2937] hover:bg-[#374151] text-gray-200 border border-white/5 rounded-2xl transition-colors"
                >
                  <MessageCircle className="w-4.5 h-4.5" />
                </button>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Main content grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Left Column: Bio & Skills */}
        <div className="md:col-span-1 space-y-6">
          {/* Bio card */}
          <div className="glass-panel rounded-3xl p-5 border border-white/5 space-y-3">
            <h3 className="text-sm font-extrabold uppercase tracking-wider text-gray-400">About Me</h3>
            <p className="text-gray-300 text-sm leading-relaxed whitespace-pre-wrap">
              {userProfile.bio || "No biography provided yet. Set a bio in your editing drawer."}
            </p>
          </div>

          {/* Skills Card */}
          <div className="glass-panel rounded-3xl p-5 border border-white/5 space-y-3">
            <h3 className="text-sm font-extrabold uppercase tracking-wider text-gray-400">Skills</h3>
            {userProfile.skills?.length > 0 ? (
              <div className="flex flex-wrap gap-1.5">
                {userProfile.skills.map((skill, i) => (
                  <span key={i} className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 px-3 py-1 rounded-xl text-xs font-semibold">
                    {skill}
                  </span>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 text-xs">No skills listed yet.</p>
            )}
          </div>
        </div>

        {/* Right Column: User Posts Feed */}
        <div className="md:col-span-2 space-y-4">
          <h3 className="font-extrabold text-lg text-white mb-2 flex items-center gap-2">
            <span>Publications</span>
            <span className="text-xs bg-emerald-500/10 text-emerald-400 px-2 py-0.5 rounded-full border border-emerald-500/20">{userPosts.length}</span>
          </h3>

          {userPosts.length === 0 ? (
            <div className="glass-panel rounded-3xl p-10 text-center border border-white/5 text-gray-500 text-sm">
              No publications shared by this user yet.
            </div>
          ) : (
            userPosts.map(post => (
              <div key={post._id} className="glass-panel rounded-3xl p-5 border border-white/5 flex flex-col gap-3">
                <p className="text-xs text-gray-500">{new Date(post.createdAt).toLocaleDateString()}</p>
                {post.text && <p className="text-gray-300 text-sm leading-relaxed">{post.text}</p>}
                {post.image && (
                  <div className="rounded-2xl overflow-hidden border border-white/5 bg-black/20 max-h-60 flex items-center justify-center">
                    <img src={post.image} alt="Attachment" className="w-full h-full object-cover" />
                  </div>
                )}
                <div className="flex gap-4 text-xs text-gray-500 pt-2 border-t border-white/5">
                  <span>{post.likes?.length || 0} Likes</span>
                  <span>{post.commentsCount || 0} Comments</span>
                </div>
              </div>
            ))
          )}
        </div>

      </div>

      {/* Editing Dialog Modal overlay */}
      {isEditing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="glass-panel rounded-3xl w-full max-w-xl max-h-[90vh] overflow-y-auto p-6 border border-white/10 relative animate-scaleIn">
            <button 
              onClick={() => setIsEditing(false)}
              className="absolute top-4 right-4 p-2 bg-[#111827] border border-white/5 rounded-full hover:bg-white/5 text-gray-400 hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>

            <h3 className="text-xl font-extrabold text-white mb-6">Edit User Profile</h3>

            <form onSubmit={handleSave} className="space-y-4">
              
              {/* Picture input */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-gray-400 mb-2">
                  Profile Picture
                </label>
                <div className="flex items-center gap-4">
                  {editPic ? (
                    <img src={editPic} alt="Preview" className="w-16 h-16 rounded-2xl object-cover bg-slate-900" />
                  ) : (
                    <div className="w-16 h-16 rounded-2xl bg-[#111827] border border-white/5 flex items-center justify-center text-gray-500">
                      <User className="w-8 h-8" />
                    </div>
                  )}
                  <label className="bg-[#1f2937] hover:bg-[#374151] border border-white/5 text-gray-300 font-semibold px-4 py-2 rounded-xl text-xs cursor-pointer flex items-center gap-1.5">
                    <Camera className="w-4 h-4" />
                    <span>Upload Image</span>
                    <input type="file" accept="image/*" onChange={handlePicChange} className="hidden" />
                  </label>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-gray-400 mb-1.5">
                  Display Name
                </label>
                <input
                  type="text"
                  required
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="w-full bg-[#111827] border border-white/10 rounded-2xl py-2.5 px-4 text-sm text-gray-200 focus:outline-none focus:border-emerald-500/50"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-gray-400 mb-1.5">
                    University / College
                  </label>
                  <input
                    type="text"
                    value={editUni}
                    onChange={(e) => setEditUni(e.target.value)}
                    className="w-full bg-[#111827] border border-white/10 rounded-2xl py-2.5 px-4 text-sm text-gray-200 focus:outline-none focus:border-emerald-500/50"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-gray-400 mb-1.5">
                    District
                  </label>
                  <select
                    value={editDistrict}
                    onChange={(e) => setEditDistrict(e.target.value)}
                    className="w-full bg-[#111827] border border-white/10 rounded-2xl py-2.5 px-4 text-sm text-gray-400 focus:text-gray-200 focus:outline-none focus:border-emerald-500/50"
                  >
                    <option value="">Select District</option>
                    {districts.map(d => (
                      <option key={d} value={d}>{d}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-gray-400 mb-1.5">
                  Biography / Bio
                </label>
                <textarea
                  value={editBio}
                  onChange={(e) => setEditBio(e.target.value)}
                  rows={3}
                  className="w-full bg-[#111827] border border-white/10 rounded-2xl py-2.5 px-4 text-sm text-gray-200 focus:outline-none focus:border-emerald-500/50 resize-none"
                />
              </div>

              {/* Skills Tags Manager */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-gray-400 mb-1.5">
                  Skill Tags
                </label>
                <div className="flex gap-2 mb-2">
                  <input
                    type="text"
                    placeholder="Add a skill (e.g. React, Coding, Java)"
                    value={newSkillText}
                    onChange={(e) => setNewSkillText(e.target.value)}
                    className="flex-1 bg-[#111827] border border-white/10 rounded-2xl px-4 py-2 text-xs focus:outline-none focus:border-emerald-500/50 text-gray-200"
                  />
                  <button
                    onClick={handleAddSkill}
                    className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold px-4 py-2 rounded-2xl text-xs transition-colors"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
                
                <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto pr-1">
                  {editSkills.map(skill => (
                    <span 
                      key={skill}
                      className="inline-flex items-center gap-1 bg-[#111827] border border-white/5 text-gray-300 px-2.5 py-1 rounded-xl text-xs font-semibold"
                    >
                      <span>{skill}</span>
                      <button 
                        type="button" 
                        onClick={() => handleRemoveSkill(skill)}
                        className="text-gray-500 hover:text-red-400 p-0.5"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  ))}
                </div>
              </div>

              <div className="flex gap-3 justify-end pt-4 border-t border-white/5">
                <button
                  type="button"
                  onClick={() => setIsEditing(false)}
                  className="bg-[#1f2937] hover:bg-[#374151] text-gray-300 font-semibold px-5 py-2.5 rounded-2xl text-xs transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold px-6 py-2.5 rounded-2xl text-xs transition-colors shadow-md shadow-emerald-500/10"
                >
                  Save Profile
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

    </div>
  );
}
