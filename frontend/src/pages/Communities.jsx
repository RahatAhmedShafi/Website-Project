import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import Feed from './Feed';
import { 
  Users, 
  Plus, 
  MapPin, 
  MessageCircle, 
  FileText, 
  Check,
  ChevronLeft,
  X
} from 'lucide-react';

export default function Communities() {
  const { user, getHeaders } = useAuth();
  
  const [communities, setCommunities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeCommunity, setActiveCommunity] = useState(null);
  
  // Creation modal states
  const [createOpen, setCreateOpen] = useState(false);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('General');
  const [error, setError] = useState('');

  const fetchCommunities = async () => {
    try {
      const res = await fetch('/api/communities', { headers: getHeaders() });
      if (res.ok) {
        const data = await res.json();
        setCommunities(data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCommunities();
  }, []);

  const handleJoin = async (communityId, e) => {
    e.stopPropagation(); // Avoid selecting the community card
    try {
      const res = await fetch(`/api/communities/${communityId}/join`, {
        method: 'POST',
        headers: getHeaders()
      });
      if (res.ok) {
        const data = await res.json(); // { members }
        setCommunities(communities.map(c => {
          if (c._id === communityId) {
            return { ...c, members: data.members };
          }
          return c;
        }));
        
        if (activeCommunity && activeCommunity._id === communityId) {
          setActiveCommunity({ ...activeCommunity, members: data.members });
        }
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    setError('');

    try {
      const res = await fetch('/api/communities', {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({ name, description, category })
      });

      if (res.ok) {
        const newCommunity = await res.json();
        setCommunities([...communities, newCommunity]);
        setName('');
        setDescription('');
        setCategory('General');
        setCreateOpen(false);
      } else {
        const data = await res.json();
        setError(data.message || 'Failed to create community');
      }
    } catch (err) {
      console.error(err);
      setError('Server error creating community');
    }
  };

  if (loading) {
    return (
      <div className="text-center py-24">
        <div className="w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
        <p className="text-gray-400 text-sm">Loading communities...</p>
      </div>
    );
  }

  // Categories list
  const categories = ['General', 'Local', 'Education', 'Career', 'Social Action'];

  return (
    <div className="max-w-6xl mx-auto py-8 px-4">
      
      {activeCommunity ? (
        /* Selected Community Feed Detail View */
        <div className="space-y-6">
          <button 
            onClick={() => setActiveCommunity(null)}
            className="inline-flex items-center gap-1 text-xs font-semibold text-gray-400 hover:text-white transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
            <span>Back to Communities List</span>
          </button>

          {/* Banner Hero of Community */}
          <div className="glass-panel rounded-3xl p-6 border border-white/5 relative overflow-hidden flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-gradient-to-r from-emerald-950/20 via-slate-900 to-emerald-950/10">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <span className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[10px] uppercase font-bold px-2 py-0.5 rounded-full">
                  {activeCommunity.category}
                </span>
                <span className="text-xs text-gray-500">{activeCommunity.members?.length || 0} Members</span>
              </div>
              <h2 className="text-2xl font-black text-white">{activeCommunity.name}</h2>
              <p className="text-gray-400 text-sm max-w-xl">{activeCommunity.description}</p>
            </div>

            <button
              onClick={(e) => handleJoin(activeCommunity._id, e)}
              className={`font-bold px-6 py-2.5 rounded-2xl text-xs transition-colors ${
                activeCommunity.members?.includes(user?._id)
                  ? 'bg-transparent border border-emerald-500/30 text-emerald-400'
                  : 'bg-emerald-600 hover:bg-emerald-500 text-white'
              }`}
            >
              {activeCommunity.members?.includes(user?._id) ? 'Joined' : 'Join Community'}
            </button>
          </div>

          {/* Feed restricted to community */}
          <Feed communityId={activeCommunity._id} />
        </div>
      ) : (
        /* Grid list of Communities */
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-2xl font-black text-white flex items-center gap-2">
                <Users className="w-6 h-6 text-emerald-400" />
                <span>Communities</span>
              </h2>
              <p className="text-gray-400 text-sm">Join university groups and local communities across Bangladesh</p>
            </div>

            <button
              onClick={() => setCreateOpen(true)}
              className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-2.5 px-4 rounded-2xl text-xs flex items-center gap-1.5 transition-colors shadow-lg shadow-emerald-500/10"
            >
              <Plus className="w-4 h-4" />
              <span>Create Community</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {communities.map((c) => {
              const isJoined = c.members?.includes(user?._id);
              return (
                <div 
                  key={c._id}
                  onClick={() => setActiveCommunity(c)}
                  className="glass-panel glass-panel-hover rounded-3xl p-5 border border-white/5 cursor-pointer flex flex-col justify-between h-48"
                >
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-[10px] bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded-full font-bold uppercase">
                        {c.category}
                      </span>
                      <span className="text-[10px] text-gray-500">{c.members?.length || 0} members</span>
                    </div>
                    <h3 className="font-extrabold text-white text-base hover:underline">{c.name}</h3>
                    <p className="text-gray-400 text-xs line-clamp-2 leading-relaxed">{c.description}</p>
                  </div>

                  <div className="pt-4 border-t border-white/5 flex justify-end">
                    <button
                      onClick={(e) => handleJoin(c._id, e)}
                      className={`font-semibold px-4 py-1.5 rounded-xl text-[10px] tracking-wide transition-colors ${
                        isJoined 
                          ? 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-400' 
                          : 'bg-[#1f2937] hover:bg-[#374151] text-gray-200 border border-white/5'
                      }`}
                    >
                      {isJoined ? 'Joined' : 'Join'}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Creation Modal */}
      {createOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="glass-panel rounded-3xl w-full max-w-md p-6 border border-white/10 relative animate-scaleIn">
            <button 
              onClick={() => setCreateOpen(false)}
              className="absolute top-4 right-4 p-2 bg-[#111827] border border-white/5 rounded-full hover:bg-white/5 text-gray-400 hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>

            <h3 className="text-lg font-extrabold text-white mb-4">Create a Community</h3>

            {error && (
              <div className="mb-4 bg-red-500/10 border border-red-500/20 text-red-400 text-xs rounded-xl px-4 py-2.5">
                {error}
              </div>
            )}

            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-gray-400 mb-1.5">
                  Community Name
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. CSE Students, Mirpur Locals"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-[#111827] border border-white/10 rounded-2xl py-2.5 px-4 text-xs text-gray-200 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-gray-400 mb-1.5">
                  Category
                </label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full bg-[#111827] border border-white/10 rounded-2xl py-2.5 px-4 text-xs text-gray-400 focus:text-gray-200 focus:outline-none"
                >
                  {categories.map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-gray-400 mb-1.5">
                  Description
                </label>
                <textarea
                  required
                  placeholder="Write a clear summary of what this community is about..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={3}
                  className="w-full bg-[#111827] border border-white/10 rounded-2xl py-2.5 px-4 text-xs text-gray-200 focus:outline-none resize-none"
                />
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
                  className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold px-5 py-2 rounded-2xl text-xs"
                >
                  Create
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
