import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import { useTheme } from '../context/ThemeContext';
import { 
  Heart, 
  BookOpen, 
  Briefcase, 
  Bell, 
  MessageSquare, 
  Search as SearchIcon, 
  LogOut, 
  User, 
  Home, 
  Users, 
  Menu, 
  X,
  Megaphone,
  Sun,
  Moon,
  ChevronRight,
  MoreHorizontal
} from 'lucide-react';

export default function Navbar() {
  const { user, logout, getHeaders } = useAuth();
  const { incomingNotification, incomingMessage } = useSocket();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [unreadNotifications, setUnreadNotifications] = useState(false);
  const [unreadMessages, setUnreadMessages] = useState(false);

  // Recommendations / autocomplete suggestion state
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const searchContainerRef = React.useRef(null);

  // More Menu dropdown state
  const [moreMenuOpen, setMoreMenuOpen] = useState(false);
  const moreMenuRef = React.useRef(null);

  React.useEffect(() => {
    if (incomingNotification) {
      setUnreadNotifications(true);
    }
  }, [incomingNotification]);

  React.useEffect(() => {
    if (incomingMessage) {
      if (location.pathname !== '/chat') {
        setUnreadMessages(true);
      }
    }
  }, [incomingMessage, location.pathname]);

  React.useEffect(() => {
    if (location.pathname === '/chat') {
      setUnreadMessages(false);
    }
  }, [location.pathname]);

  // Suggestions search debounced API fetcher (Optimized for instant keystroke triggers)
  useEffect(() => {
    const delayDebounce = setTimeout(async () => {
      if (searchQuery.trim().length >= 1) {
        try {
          const res = await fetch(`/api/search?q=${encodeURIComponent(searchQuery.trim())}`, {
            headers: getHeaders()
          });
          if (res.ok) {
            const data = await res.json();
            // Show matching users in autocomplete dropdown recommendations
            setSuggestions(data.users || []);
            setShowSuggestions(true);
          }
        } catch (err) {
          console.error('Error fetching suggestions:', err);
        }
      } else {
        setSuggestions([]);
        setShowSuggestions(false);
      }
    }, 30);

    return () => clearTimeout(delayDebounce);
  }, [searchQuery]);

  // Handle outside clicks to close the search recommendations panel
  useEffect(() => {
    const handleOutsideClick = (e) => {
      if (searchContainerRef.current && !searchContainerRef.current.contains(e.target)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, []);

  // Close more menu dropdown on outside click
  useEffect(() => {
    const handleOutsideClick = (e) => {
      if (moreMenuRef.current && !moreMenuRef.current.contains(e.target)) {
        setMoreMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, []);

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
      setSearchQuery('');
      setShowSuggestions(false);
    }
  };

  const navItems = [
    { name: 'Feed', path: '/', icon: Home },
    { name: 'Communities', path: '/communities', icon: Users },
    { name: 'Blood Donor', path: '/blood', icon: Heart, color: 'text-red-500' },
    { name: 'Tuitions', path: '/tuition', icon: BookOpen },
    { name: 'Jobs', path: '/jobs', icon: Briefcase },
    { name: 'Notice Board', path: '/notices', icon: Megaphone },
  ];

  if (!user) return null;

  return (
    <nav className="sticky top-0 z-50 glass-panel border-b dark:border-white/5 border-slate-200/80 bg-slate-50/85 dark:bg-[#0b0f17]/85 backdrop-blur-md px-4 py-3">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
        
        {/* Logo */}
        <Link to="/" className="flex items-center gap-2">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-500 to-red-500 p-0.5 flex items-center justify-center shadow-lg shadow-emerald-500/10">
            <div className="w-full h-full bg-slate-50 dark:bg-[#0b0f17] rounded-[10px] flex items-center justify-center font-bold text-emerald-400 dark:text-emerald-400 text-xl tracking-tighter">
              V
            </div>
          </div>
          <span className="hidden sm:inline font-bold text-2xl bg-gradient-to-r from-emerald-600 dark:from-emerald-400 via-teal-600 dark:via-teal-300 to-emerald-500 dark:to-emerald-200 bg-clip-text text-transparent">
            Vibora
          </span>
        </Link>

        {/* Autocomplete Search Bar */}
        <div ref={searchContainerRef} className="flex-1 max-w-md relative hidden md:block">
          <form onSubmit={handleSearch}>
            <input
              type="text"
              placeholder="Search Vibora (users, posts, communities)..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onFocus={() => searchQuery.trim().length >= 2 && setShowSuggestions(true)}
              className="w-full bg-white dark:bg-[#111827] border border-slate-200 dark:border-white/10 rounded-full px-4 py-1.5 pl-10 text-sm focus:outline-none focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/20 text-slate-800 dark:text-gray-200"
            />
            <SearchIcon className="w-4 h-4 text-gray-400 absolute left-3.5 top-2.5" />
          </form>

          {/* Suggestions Dropdown panel */}
          {showSuggestions && suggestions.length > 0 && (
            <div className="absolute top-full left-0 right-0 mt-2 glass-panel bg-white/95 dark:bg-[#111827]/95 border border-slate-200 dark:border-white/10 rounded-2xl shadow-xl overflow-hidden z-50 p-2 space-y-1">
              <p className="text-[10px] text-gray-400 font-extrabold uppercase px-2 py-1 tracking-wider">Quick Suggestions</p>
              {suggestions.map((u) => (
                <div
                  key={u._id}
                  onClick={() => {
                    navigate(`/profile/${u._id}`);
                    setShowSuggestions(false);
                    setSearchQuery('');
                  }}
                  className="w-full flex items-center justify-between p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-white/5 cursor-pointer text-left transition-colors"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    {u.profilePicture ? (
                      <img src={u.profilePicture} alt={u.name} className="w-8 h-8 rounded-full object-cover shrink-0" />
                    ) : (
                      <div className="w-8 h-8 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center font-extrabold text-[10px] uppercase shrink-0">
                        {u.name.charAt(0)}
                      </div>
                    )}
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-slate-800 dark:text-gray-200 truncate">{u.name}</p>
                      <p className="text-[9px] text-gray-400 truncate">{u.university || u.district || 'Vibora Citizen'}</p>
                    </div>
                  </div>
                  <ChevronRight className="w-3.5 h-3.5 text-gray-400" />
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Desktop Nav Actions */}
        <div className="hidden lg:flex items-center gap-1">
          {navItems.slice(0, 2).map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-sm font-medium transition-all ${
                  isActive 
                    ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20' 
                    : 'text-slate-500 dark:text-gray-400 hover:text-slate-800 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/5 border border-transparent'
                }`}
              >
                <Icon className={`w-4 h-4 ${item.color || ''}`} />
                <span>{item.name}</span>
              </Link>
            );
          })}

          {/* Three Dot More dropdown menu container */}
          <div ref={moreMenuRef} className="relative">
            <button
              onClick={() => setMoreMenuOpen(!moreMenuOpen)}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-sm font-medium text-slate-500 dark:text-gray-400 hover:text-slate-800 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/5 border border-transparent cursor-pointer transition-all"
            >
              <MoreHorizontal className="w-4 h-4" />
              <span>More</span>
            </button>

            {moreMenuOpen && (
              <div className="absolute right-0 top-full mt-2 w-48 glass-panel bg-white/95 dark:bg-[#111827]/95 border border-slate-200 dark:border-white/5 rounded-2xl shadow-xl overflow-hidden z-50 p-2 space-y-1">
                {navItems.slice(2).map((item) => {
                  const Icon = item.icon;
                  const isActive = location.pathname === item.path;
                  return (
                    <Link
                      key={item.path}
                      to={item.path}
                      onClick={() => setMoreMenuOpen(false)}
                      className={`flex items-center gap-2.5 p-2.5 rounded-xl text-xs font-semibold transition-all ${
                        isActive 
                          ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20' 
                          : 'text-slate-600 dark:text-gray-300 hover:bg-slate-100 dark:hover:bg-white/5'
                      }`}
                    >
                      <Icon className={`w-4 h-4 ${item.color || ''}`} />
                      <span>{item.name}</span>
                    </Link>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Right side Profile, Light/Dark theme & Alerts */}
        <div className="flex items-center gap-3">
          {/* Search Icon (Mobile) */}
          <button onClick={() => navigate('/search')} className="md:hidden p-2 hover:bg-slate-100 dark:hover:bg-white/5 rounded-full text-gray-500 dark:text-gray-400">
            <SearchIcon className="w-5 h-5" />
          </button>

          {/* Theme Mode Toggle Button */}
          <button 
            onClick={toggleTheme} 
            className="p-2 hover:bg-slate-100 dark:hover:bg-white/5 rounded-full text-gray-500 dark:text-gray-400 hover:text-slate-800 dark:hover:text-white cursor-pointer transition-colors"
            title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
          >
            {theme === 'dark' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
          </button>

          {/* Direct Messages */}
          <Link to="/chat" className="p-2 hover:bg-slate-100 dark:hover:bg-white/5 rounded-full text-gray-500 dark:text-gray-400 hover:text-slate-800 dark:hover:text-white relative">
            <MessageSquare className="w-5 h-5" />
            {unreadMessages && (
              <span className="absolute top-1.5 right-1.5 w-2.5 h-2.5 bg-emerald-500 rounded-full border-2 border-slate-50 dark:border-[#0b0f17]" />
            )}
          </Link>

          {/* Notifications */}
          <Link to="/notifications" className="p-2 hover:bg-slate-100 dark:hover:bg-white/5 rounded-full text-gray-500 dark:text-gray-400 hover:text-slate-800 dark:hover:text-white relative">
            <Bell className="w-5 h-5" />
            {unreadNotifications && (
              <span className="absolute top-1.5 right-1.5 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-slate-50 dark:border-[#0b0f17]" />
            )}
          </Link>

          {/* User Profile avatar */}
          <Link to={`/profile/${user._id}`} className="flex items-center gap-2 p-1 hover:bg-slate-100 dark:hover:bg-white/5 rounded-full pl-1 pr-3 border border-slate-200 dark:border-white/5 bg-white dark:bg-[#111827]">
            {user.profilePicture ? (
              <img src={user.profilePicture} alt={user.name} className="w-7 h-7 rounded-full object-cover" />
            ) : (
              <div className="w-7 h-7 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold text-xs uppercase">
                {user.name.charAt(0)}
              </div>
            )}
            <span className="text-xs font-semibold text-slate-700 dark:text-gray-300 hidden sm:inline max-w-[80px] truncate">{user.name}</span>
          </Link>

          {/* Logout */}
          <button onClick={logout} className="p-2 hover:bg-red-500/10 hover:text-red-600 dark:hover:text-red-400 rounded-full text-gray-500 dark:text-gray-400 transition-colors cursor-pointer">
            <LogOut className="w-5 h-5" />
          </button>

          {/* Mobile Menu Toggle */}
          <button 
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="lg:hidden p-2 hover:bg-slate-100 dark:hover:bg-white/5 rounded-xl text-gray-500 dark:text-gray-400 hover:text-slate-800 dark:hover:text-white"
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>

      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="lg:hidden mt-3 pt-3 border-t border-slate-200 dark:border-white/5 flex flex-col gap-1.5 animate-fadeIn">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                onClick={() => setMobileMenuOpen(false)}
                className={`flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium ${
                  isActive 
                    ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20' 
                    : 'text-slate-500 dark:text-gray-400 hover:text-slate-800 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/5 border border-transparent'
                }`}
              >
                <Icon className={`w-5 h-5 ${item.color || ''}`} />
                <span>{item.name}</span>
              </Link>
            );
          })}
        </div>
      )}
    </nav>
  );
}
