import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Search as SearchIcon, Users, User, FileText, ChevronRight } from 'lucide-react';

export default function Search() {
  const { user, getHeaders, followUser } = useAuth();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const query = searchParams.get('q') || '';
  const [term, setTerm] = useState(query);
  const [results, setResults] = useState({ users: [], posts: [], communities: [] });
  const [loading, setLoading] = useState(false);

  // Recommendations state
  const [recommendations, setRecommendations] = useState([]);
  const [loadingRecs, setLoadingRecs] = useState(false);

  const fetchResults = async () => {
    if (!query) return;
    try {
      setLoading(true);
      const res = await fetch(`/api/search?q=${encodeURIComponent(query)}`, { headers: getHeaders() });
      if (res.ok) {
        const data = await res.json();
        setResults(data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchRecommendations = async () => {
    try {
      setLoadingRecs(true);
      const res = await fetch('/api/search/recommendations', { headers: getHeaders() });
      if (res.ok) {
        const data = await res.json();
        setRecommendations(data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingRecs(false);
    }
  };

  useEffect(() => {
    setTerm(query);
    fetchResults();
    if (!query) {
      fetchRecommendations();
    }
  }, [query]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (term.trim()) {
      navigate(`/search?q=${encodeURIComponent(term.trim())}`);
    }
  };

  return (
    <div className="max-w-4xl mx-auto py-8 px-4 space-y-6">
      
      {/* Search Header input block */}
      <form onSubmit={handleSubmit} className="glass-panel rounded-3xl p-5 border border-white/5 relative">
        <div className="relative">
          <input
            type="text"
            required
            placeholder="Search for people, posts, or community topics..."
            value={term}
            onChange={(e) => setTerm(e.target.value)}
            className="w-full bg-[#111827] border border-white/10 rounded-2xl py-3 px-4 pl-11 text-sm text-gray-200 focus:outline-none"
          />
          <SearchIcon className="w-5 h-5 text-gray-500 absolute left-4 top-3.5" />
        </div>
      </form>

      {query && (
        <p className="text-sm text-gray-400">
          Showing search results for <span className="text-white font-bold">"{query}"</span>
        </p>
      )}

      {loading ? (
        <div className="text-center py-20">
          <div className="w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-gray-400 text-sm">Searching global records...</p>
        </div>
      ) : !query ? (
        <div className="space-y-6 animate-fadeIn">
          <div className="glass-panel rounded-3xl p-8 text-center border border-slate-200 dark:border-white/5 text-gray-500 text-sm">
            <SearchIcon className="w-10 h-10 text-gray-400 mx-auto mb-3 animate-pulse-slow" />
            <p className="font-semibold text-slate-700 dark:text-gray-300">Start Searching Vibora</p>
            <p className="text-xs text-gray-400 mt-1">Enter a search phrase above to search users, posts, or community topics.</p>
          </div>

          {/* Suggested Friends */}
          <div className="space-y-4">
            <h3 className="font-extrabold text-sm uppercase tracking-wider text-slate-500 dark:text-gray-400">People You May Know</h3>
            {loadingRecs ? (
              <p className="text-xs text-gray-500 text-center py-6">Loading recommendations...</p>
            ) : recommendations.length === 0 ? (
              <p className="text-xs text-gray-500 text-center py-6">No suggestions found. You followed all citizens!</p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {recommendations.map((rec) => (
                  <div 
                    key={rec._id}
                    className="glass-panel rounded-3xl p-4 border border-slate-200 dark:border-white/5 flex items-center justify-between gap-3"
                  >
                    <Link to={`/profile/${rec._id}`} className="flex items-center gap-3 min-w-0">
                      {rec.profilePicture ? (
                        <img src={rec.profilePicture} alt={rec.name} className="w-10 h-10 rounded-full object-cover shrink-0" />
                      ) : (
                        <div className="w-10 h-10 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-extrabold text-xs uppercase shrink-0">
                          {rec.name.charAt(0)}
                        </div>
                      )}
                      <div className="min-w-0">
                        <h4 className="font-bold text-slate-800 dark:text-gray-200 text-xs truncate hover:underline">{rec.name}</h4>
                        <p className="text-[10px] text-gray-400 truncate mt-0.5">
                          {rec.university || rec.district || 'Vibora Citizen'}
                        </p>
                      </div>
                    </Link>

                    <button
                      onClick={async () => {
                        try {
                          await followUser(rec._id);
                          setRecommendations(prev => prev.filter(r => r._id !== rec._id));
                        } catch (err) {
                          console.error(err);
                        }
                      }}
                      className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold px-4 py-1.5 rounded-xl text-[10px] transition-colors cursor-pointer shrink-0"
                    >
                      Follow
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="space-y-8 animate-fadeIn">
          
          {/* USERS RESULTS */}
          {results.users?.length > 0 && (
            <div className="space-y-3">
              <h3 className="font-extrabold text-sm uppercase tracking-wider text-gray-400 flex items-center gap-1.5">
                <User className="w-4.5 h-4.5 text-teal-400" />
                <span>Users ({results.users.length})</span>
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {results.users.map((item) => (
                  <Link 
                    key={item._id}
                    to={`/profile/${item._id}`}
                    className="glass-panel glass-panel-hover rounded-2xl p-4 border border-white/5 flex items-center gap-3"
                  >
                    {item.profilePicture ? (
                      <img src={item.profilePicture} alt={item.name} className="w-10 h-10 rounded-full object-cover shrink-0" />
                    ) : (
                      <div className="w-10 h-10 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold uppercase shrink-0">
                        {item.name.charAt(0)}
                      </div>
                    )}
                    <div className="overflow-hidden">
                      <h4 className="font-bold text-gray-200 text-xs truncate">{item.name}</h4>
                      <p className="text-[10px] text-gray-500 truncate mt-0.5">
                        {item.university || item.district || 'Vibora Citizen'}
                      </p>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}

          {/* COMMUNITIES RESULTS */}
          {results.communities?.length > 0 && (
            <div className="space-y-3">
              <h3 className="font-extrabold text-sm uppercase tracking-wider text-gray-400 flex items-center gap-1.5">
                <Users className="w-4.5 h-4.5 text-teal-400" />
                <span>Communities ({results.communities.length})</span>
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {results.communities.map((item) => (
                  <Link 
                    key={item._id}
                    to={`/communities`} // Routes to communities page where they can select it
                    className="glass-panel glass-panel-hover rounded-2xl p-4 border border-white/5 flex flex-col justify-between h-28"
                  >
                    <div>
                      <h4 className="font-bold text-gray-200 text-xs">{item.name}</h4>
                      <p className="text-[10px] text-gray-500 line-clamp-2 mt-1 leading-relaxed">
                        {item.description}
                      </p>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}

          {/* POSTS RESULTS */}
          {results.posts?.length > 0 && (
            <div className="space-y-3">
              <h3 className="font-extrabold text-sm uppercase tracking-wider text-gray-400 flex items-center gap-1.5">
                <FileText className="w-4.5 h-4.5 text-teal-400" />
                <span>Publications ({results.posts.length})</span>
              </h3>
              <div className="space-y-3">
                {results.posts.map((post) => (
                  <div key={post._id} className="glass-panel rounded-2xl p-4 border border-white/5 space-y-2">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold text-xs uppercase">
                        {post.user?.name ? post.user.name.charAt(0) : 'U'}
                      </div>
                      <div>
                        <span className="font-bold text-gray-300 text-xs">{post.user?.name}</span>
                        <span className="text-[9px] text-gray-500 ml-2">{new Date(post.createdAt).toLocaleDateString()}</span>
                      </div>
                    </div>
                    <p className="text-gray-300 text-xs leading-relaxed whitespace-pre-wrap">{post.text}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* If query has run and all results arrays are empty */}
          {results.users?.length === 0 && results.communities?.length === 0 && results.posts?.length === 0 && (
            <div className="glass-panel rounded-3xl p-12 text-center border border-white/5 text-gray-500 text-sm">
              No matching records found. Try another search word!
            </div>
          )}

        </div>
      )}

    </div>
  );
}
