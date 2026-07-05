import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Bell, Heart, MessageCircle, UserPlus, Check, Sparkles } from 'lucide-react';

export default function Notifications() {
  const { user, getHeaders, acceptFriendRequest, declineFriendRequest } = useAuth();
  
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

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

  const getAlertIcon = (type) => {
    switch (type) {
      case 'like': return <Heart className="w-4 h-4 text-red-500 fill-current" />;
      case 'comment': return <MessageCircle className="w-4 h-4 text-emerald-400" />;
      case 'follow': return <UserPlus className="w-4 h-4 text-teal-400" />;
      case 'friend_request': return <UserPlus className="w-4 h-4 text-emerald-400 animate-pulse" />;
      case 'friend_accept': return <UserPlus className="w-4 h-4 text-teal-400" />;
      default: return <Bell className="w-4 h-4 text-amber-400" />;
    }
  };

  return (
    <div className="max-w-2xl mx-auto py-8 px-4 space-y-6">
      
      <div className="flex justify-between items-center mb-2">
        <div>
          <h2 className="text-2xl font-black text-white flex items-center gap-2">
            <Bell className="w-6 h-6 text-emerald-400" />
            <span>Alerts & Notifications</span>
          </h2>
          <p className="text-gray-400 text-sm">Keep up with likes, comments, and followers actions</p>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-20">
          <div className="w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-gray-400 text-sm">Loading alerts...</p>
        </div>
      ) : notifications.length === 0 ? (
        <div className="glass-panel rounded-3xl p-12 text-center border border-white/5 text-gray-500 text-sm">
          No new alerts found in your notifications tray.
        </div>
      ) : (
        <div className="space-y-3">
          {notifications.map((alert) => (
            <div 
              key={alert._id}
              className={`glass-panel rounded-2xl p-4 border border-white/5 flex items-center gap-4 transition-all ${
                !alert.read ? 'bg-emerald-500/[0.03] border-emerald-500/10' : ''
              }`}
            >
              <div className="w-8 h-8 rounded-xl bg-white/5 flex items-center justify-center shrink-0 border border-white/5">
                {getAlertIcon(alert.type)}
              </div>

              <div className="flex-1 min-w-0">
                <p className="text-xs text-gray-300 leading-snug">
                  <span className="font-extrabold text-white">{alert.sender?.name || 'Someone'}</span>{' '}
                  {alert.type === 'like' && 'liked your publication.'}
                  {alert.type === 'comment' && 'commented on your publication.'}
                  {alert.type === 'follow' && 'started following you.'}
                  {alert.type === 'friend_request' && 'sent you a friend request.'}
                  {alert.type === 'friend_accept' && 'accepted your friend request.'}
                  {alert.type === 'post' && 'published a new publication.'}
                  {alert.type === 'tuition' && 'posted a new tuition update.'}
                  {alert.type === 'job' && 'posted a new job listing.'}
                </p>
                {alert.type === 'friend_request' && alert.sender && (
                  <div className="flex gap-2 mt-2.5">
                    <button 
                      onClick={() => handleAccept(alert.sender._id)}
                      className="bg-emerald-600 hover:bg-emerald-500 text-white text-[10px] font-bold px-3 py-1.5 rounded-xl transition-colors cursor-pointer"
                    >
                      Accept
                    </button>
                    <button 
                      onClick={() => handleDecline(alert.sender._id)}
                      className="bg-white/5 hover:bg-white/10 text-gray-400 text-[10px] font-bold px-3 py-1.5 rounded-xl border border-white/5 transition-colors cursor-pointer"
                    >
                      Decline
                    </button>
                  </div>
                )}
                <p className="text-[10px] text-gray-500 mt-1">
                  {new Date(alert.createdAt).toLocaleString()}
                </p>
              </div>

              {!alert.read && (
                <span className="w-2 h-2 bg-emerald-400 rounded-full shrink-0" />
              )}
            </div>
          ))}
        </div>
      )}

    </div>
  );
}
