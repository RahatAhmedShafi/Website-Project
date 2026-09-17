import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { 
  Bell, 
  Heart, 
  MessageCircle, 
  UserPlus, 
  UserCheck, 
  Sparkles, 
  Unlock, 
  BookOpen, 
  Briefcase, 
  ChevronDown, 
  ChevronUp, 
  Maximize2, 
  Minimize2, 
  Clock, 
  ExternalLink, 
  Lock, 
  Info
} from 'lucide-react';

export default function Notifications() {
  const { user, getHeaders, acceptFriendRequest, declineFriendRequest } = useAuth();
  
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedIds, setExpandedIds] = useState({});
  const [allExpanded, setAllExpanded] = useState(false);

  const handleAccept = async (senderId) => {
    try {
      await acceptFriendRequest(senderId);
      fetchNotifications();
    } catch (err) {
      console.error(err);
    }
  };

  const handleDecline = async (senderId) => {
    try {
      await declineFriendRequest(senderId);
      fetchNotifications();
    } catch (err) {
      console.error(err);
    }
  };

  const fetchNotifications = async () => {
    try {
      const res = await fetch('/api/notifications', { headers: getHeaders() });
      if (res.ok) {
        const data = await res.json();
        setNotifications(data);

        // Mark all as read after fetching
        fetch('/api/notifications/read', {
          method: 'PUT',
          headers: getHeaders()
        });
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, []);

  const toggleExpand = (id) => {
    setExpandedIds(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  const toggleExpandAll = () => {
    const nextState = !allExpanded;
    setAllExpanded(nextState);
    const newExpanded = {};
    notifications.forEach(n => {
      newExpanded[n._id] = nextState;
    });
    setExpandedIds(newExpanded);
  };

  const getAlertIcon = (type) => {
    switch (type) {
      case 'like': return <Heart className="w-4 h-4 text-red-500 fill-current" />;
      case 'comment': return <MessageCircle className="w-4 h-4 text-emerald-400" />;
      case 'follow': return <UserPlus className="w-4 h-4 text-teal-400" />;
      case 'friend_request': return <UserCheck className="w-4 h-4 text-blue-400 animate-pulse" />;
      case 'friend_accept': return <UserCheck className="w-4 h-4 text-emerald-400" />;
      case 'contact_revealed': return <Unlock className="w-4 h-4 text-amber-400 animate-pulse" />;
      case 'post': return <Sparkles className="w-4 h-4 text-indigo-400" />;
      case 'tuition': return <BookOpen className="w-4 h-4 text-purple-400" />;
      case 'job': return <Briefcase className="w-4 h-4 text-blue-400" />;
      default: return <Bell className="w-4 h-4 text-amber-400" />;
    }
  };

  const getAlertText = (alert) => {
    switch (alert.type) {
      case 'contact_revealed':
        return 'requested and unmasked your contact phone number.';
      case 'like':
        return 'liked your publication.';
      case 'comment':
        return 'commented on your publication.';
      case 'follow':
        return 'started following you.';
      case 'friend_request':
        return 'sent you a friend request.';
      case 'friend_accept':
        return 'accepted your friend request.';
      case 'post':
        return 'published a new publication.';
      case 'tuition':
        return 'posted a new tuition update.';
      case 'job':
        return 'posted a new job listing.';
      default:
        return alert.details || 'sent you a notification.';
    }
  };

  return (
    <div className="max-w-3xl mx-auto py-8 px-4 space-y-6 animate-fadeIn">
      
      {/* Header section with Expand All controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 glass-panel rounded-3xl p-6 border border-white/5 bg-gradient-to-r from-slate-900 via-[#111827] to-slate-900">
        <div>
          <h2 className="text-2xl font-black text-white flex items-center gap-2">
            <Bell className="w-6 h-6 text-emerald-400" />
            <span>Alerts & Notifications</span>
          </h2>
          <p className="text-gray-400 text-xs sm:text-sm mt-1">
            Keep up with likes, comments, contact number requests, and network activities.
          </p>
        </div>

        {notifications.length > 0 && (
          <button
            onClick={toggleExpandAll}
            className="bg-white/5 hover:bg-white/10 text-gray-300 hover:text-white border border-white/10 font-bold px-4 py-2 rounded-2xl text-xs flex items-center gap-1.5 transition-all shrink-0 cursor-pointer"
          >
            {allExpanded ? (
              <>
                <Minimize2 className="w-3.5 h-3.5 text-amber-400" />
                <span>Collapse All</span>
              </>
            ) : (
              <>
                <Maximize2 className="w-3.5 h-3.5 text-emerald-400" />
                <span>Extend All Details</span>
              </>
            )}
          </button>
        )}
      </div>

      {loading ? (
        <div className="text-center py-20">
          <div className="w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-gray-400 text-sm">Loading alerts...</p>
        </div>
      ) : notifications.length === 0 ? (
        <div className="glass-panel rounded-3xl p-12 text-center border border-white/5 text-gray-500 text-sm space-y-2">
          <Bell className="w-10 h-10 text-gray-600 mx-auto opacity-50" />
          <p className="font-semibold text-gray-400">No new alerts found in your notifications tray.</p>
          <p className="text-xs text-gray-500">Activity updates and contact reveal alerts will show up here.</p>
        </div>
      ) : (
        <div className="space-y-3.5">
          {notifications.map((alert) => {
            const isExpanded = Boolean(expandedIds[alert._id]);
            const isContactReveal = alert.type === 'contact_revealed';

            return (
              <div 
                key={alert._id}
                className={`glass-panel rounded-2xl border transition-all ${
                  isContactReveal 
                    ? 'border-amber-500/30 bg-gradient-to-r from-amber-950/20 via-[#111827] to-[#111827]'
                    : !alert.read 
                    ? 'border-emerald-500/20 bg-emerald-500/[0.03]' 
                    : 'border-white/5 bg-[#111827]/70'
                }`}
              >
                {/* Notification Main Header */}
                <div className="p-4 flex items-start gap-3.5">
                  <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 border mt-0.5 ${
                    isContactReveal 
                      ? 'bg-amber-500/10 border-amber-500/30 text-amber-400' 
                      : 'bg-white/5 border-white/10'
                  }`}>
                    {getAlertIcon(alert.type)}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-xs text-gray-200 leading-snug">
                        {alert.sender ? (
                          <Link to={`/profile/${alert.sender._id}`} className="font-extrabold text-white hover:underline">
                            {alert.sender.name}
                          </Link>
                        ) : (
                          <span className="font-extrabold text-white">Someone</span>
                        )}{' '}
                        <span className={isContactReveal ? 'text-amber-300 font-medium' : 'text-gray-300'}>
                          {getAlertText(alert)}
                        </span>
                      </p>
                    </div>

                    {/* Short time & Expand trigger */}
                    <div className="flex items-center justify-between mt-2 pt-1 border-t border-white/5">
                      <span className="text-[10px] text-gray-400 flex items-center gap-1 font-mono">
                        <Clock className="w-3 h-3 text-gray-500" />
                        {new Date(alert.createdAt).toLocaleString()}
                      </span>

                      <button
                        onClick={() => toggleExpand(alert._id)}
                        className="text-[11px] font-bold text-emerald-400 hover:text-emerald-300 flex items-center gap-1 transition-colors cursor-pointer py-0.5 px-2 rounded-lg hover:bg-emerald-500/10"
                      >
                        <span>{isExpanded ? 'Hide Details' : 'Extend Details'}</span>
                        {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                  </div>

                  {!alert.read && (
                    <span className="w-2.5 h-2.5 bg-emerald-400 rounded-full shrink-0 animate-pulse mt-1" />
                  )}
                </div>

                {/* Extended Details Drawer */}
                {isExpanded && (
                  <div className="px-4 pb-4 pt-2 border-t border-white/5 bg-black/20 rounded-b-2xl space-y-3 animate-fadeIn">
                    
                    {/* Specific PII Contact Reveal Security Box */}
                    {isContactReveal ? (
                      <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-3 text-xs space-y-1.5">
                        <div className="flex items-center gap-2 text-amber-300 font-bold">
                          <Lock className="w-4 h-4 text-amber-400 shrink-0" />
                          <span>Contact Phone Number Requested</span>
                        </div>
                        <p className="text-gray-300 leading-relaxed text-xs">
                          {alert.details || 'A registered user requested access to view your contact phone number.'}
                        </p>
                      </div>
                    ) : alert.details ? (
                      <div className="bg-white/5 border border-white/10 rounded-xl p-3 text-xs text-gray-300 leading-relaxed">
                        <div className="flex items-center gap-1.5 text-emerald-400 font-semibold mb-1">
                          <Info className="w-3.5 h-3.5" />
                          <span>Notification Context</span>
                        </div>
                        {alert.details}
                      </div>
                    ) : null}

                    {/* Post Preview if notification is related to a post */}
                    {alert.post && typeof alert.post === 'object' && alert.post.text && (
                      <div className="bg-slate-900/80 border border-white/5 rounded-xl p-3 text-xs text-gray-300 space-y-1">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Related Publication Preview</span>
                        <p className="italic text-gray-300 line-clamp-2">"{alert.post.text}"</p>
                      </div>
                    )}

                    {/* Action Controls & Direct Links */}
                    <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-white/5">
                      <div className="flex items-center gap-2">
                        {alert.sender && (
                          <Link
                            to={`/profile/${alert.sender._id}`}
                            className="bg-white/5 hover:bg-white/10 text-gray-300 hover:text-white border border-white/10 text-[11px] font-bold px-3 py-1.5 rounded-xl transition-all flex items-center gap-1"
                          >
                            <span>View User Profile</span>
                            <ExternalLink className="w-3 h-3 text-gray-400" />
                          </Link>
                        )}

                        {alert.post && (
                          <Link
                            to={`/?post=${typeof alert.post === 'object' ? alert.post._id : alert.post}`}
                            className="bg-emerald-600/20 hover:bg-emerald-600 text-emerald-400 hover:text-white border border-emerald-500/30 text-[11px] font-bold px-3 py-1.5 rounded-xl transition-all flex items-center gap-1"
                          >
                            <span>View Related Post</span>
                            <ExternalLink className="w-3 h-3" />
                          </Link>
                        )}
                      </div>

                      {/* Friend Request Accept/Decline */}
                      {alert.type === 'friend_request' && alert.sender && (
                        <div className="flex gap-2">
                          <button 
                            onClick={() => handleAccept(alert.sender._id)}
                            className="bg-emerald-600 hover:bg-emerald-500 text-white text-[11px] font-bold px-3.5 py-1.5 rounded-xl transition-colors cursor-pointer"
                          >
                            Accept Request
                          </button>
                          <button 
                            onClick={() => handleDecline(alert.sender._id)}
                            className="bg-white/5 hover:bg-white/10 text-gray-400 text-[11px] font-bold px-3.5 py-1.5 rounded-xl border border-white/5 transition-colors cursor-pointer"
                          >
                            Decline
                          </button>
                        </div>
                      )}

                      <span className="text-[10px] text-gray-500 font-mono">
                        ID: {alert._id}
                      </span>
                    </div>

                  </div>
                )}

              </div>
            );
          })}
        </div>
      )}

    </div>
  );
}
