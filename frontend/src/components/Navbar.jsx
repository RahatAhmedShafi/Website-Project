import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
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
  Megaphone
} from 'lucide-react';

export default function Navbar() {
  const { user, logout } = useAuth();
  const { incomingNotification, incomingMessage } = useSocket();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [unreadNotifications, setUnreadNotifications] = useState(false);
  const [unreadMessages, setUnreadMessages] = useState(false);

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

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchQuery)}`);
      setSearchQuery('');
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
    <nav className="sticky top-0 z-50 glass-panel border-b border-white/5 bg-[#0b0f17]/85 backdrop-blur-md px-4 py-3">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
        
        {/* Logo */}
        <Link to="/" className="flex items-center gap-2">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-500 to-red-500 p-0.5 flex items-center justify-center shadow-lg shadow-emerald-500/10">
            <div className="w-full h-full bg-[#0b0f17] rounded-[10px] flex items-center justify-center font-bold text-emerald-400 text-xl tracking-tighter">
              V
            </div>
          </div>
          <span className="hidden sm:inline font-bold text-2xl bg-gradient-to-r from-emerald-400 via-teal-300 to-emerald-200 bg-clip-text text-transparent">
            Vibora
          </span>
        </Link>

        {/* Search Bar */}
        <form onSubmit={handleSearch} className="flex-1 max-w-md relative hidden md:block">
          <input
            type="text"
            placeholder="Search Vibora (users, posts, communities)..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-[#111827] border border-white/10 rounded-full px-4 py-1.5 pl-10 text-sm focus:outline-none focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/20 text-gray-200"
          />
          <SearchIcon className="w-4 h-4 text-gray-400 absolute left-3.5 top-2.5" />
        </form>

        {/* Desktop Nav Actions */}
        <div className="hidden lg:flex items-center gap-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-sm font-medium transition-all ${
                  isActive 
                    ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' 
                    : 'text-gray-400 hover:text-white hover:bg-white/5 border border-transparent'
                }`}
              >
                <Icon className={`w-4 h-4 ${item.color || ''}`} />
                <span>{item.name}</span>
              </Link>
            );
          })}
        </div>

        {/* Right side Profile & Alerts */}
        <div className="flex items-center gap-3">
          {/* Search Icon (Mobile) */}
          <button onClick={() => navigate('/search')} className="md:hidden p-2 hover:bg-white/5 rounded-full text-gray-400 hover:text-white">
            <SearchIcon className="w-5 h-5" />
          </button>

          {/* Direct Messages */}
          <Link to="/chat" className="p-2 hover:bg-white/5 rounded-full text-gray-400 hover:text-white relative">
            <MessageSquare className="w-5 h-5" />
            {unreadMessages && (
              <span className="absolute top-1.5 right-1.5 w-2.5 h-2.5 bg-emerald-500 rounded-full border-2 border-[#0b0f17]" />
            )}
          </Link>

          {/* Notifications */}
          <Link to="/notifications" className="p-2 hover:bg-white/5 rounded-full text-gray-400 hover:text-white relative">
            <Bell className="w-5 h-5" />
            {unreadNotifications && (
              <span className="absolute top-1.5 right-1.5 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-[#0b0f17]" />
            )}
          </Link>

          {/* User Profile dropdown or avatar */}
          <Link to={`/profile/${user._id}`} className="flex items-center gap-2 p-1 hover:bg-white/5 rounded-full pl-1 pr-3 border border-white/5 bg-[#111827]">
            {user.profilePicture ? (
              <img src={user.profilePicture} alt={user.name} className="w-7 h-7 rounded-full object-cover" />
            ) : (
              <div className="w-7 h-7 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold text-xs uppercase">
                {user.name.charAt(0)}
              </div>
            )}
            <span className="text-xs font-semibold text-gray-300 hidden sm:inline max-w-[80px] truncate">{user.name}</span>
          </Link>

          {/* Logout */}
          <button onClick={logout} className="p-2 hover:bg-red-500/10 hover:text-red-400 rounded-full text-gray-400 transition-colors">
            <LogOut className="w-5 h-5" />
          </button>

          {/* Mobile Menu Toggle */}
          <button 
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="lg:hidden p-2 hover:bg-white/5 rounded-xl text-gray-400 hover:text-white"
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>

      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="lg:hidden mt-3 pt-3 border-t border-white/5 flex flex-col gap-1.5 animate-fadeIn">
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
                    ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' 
                    : 'text-gray-400 hover:text-white hover:bg-white/5 border border-transparent'
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
