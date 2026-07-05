import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { SocketProvider, useSocket } from './context/SocketContext';
import { MessageSquare, Bell, X } from 'lucide-react';

// Components
import Navbar from './components/Navbar';

// Pages
import Login from './pages/Login';
import Register from './pages/Register';
import Feed from './pages/Feed';
import Profile from './pages/Profile';
import Communities from './pages/Communities';
import BloodDonor from './pages/BloodDonor';
import Tuition from './pages/Tuition';
import Jobs from './pages/Jobs';
import NoticeBoard from './pages/NoticeBoard';
import Chat from './pages/Chat';
import Search from './pages/Search';
import Notifications from './pages/Notifications';

// Private Route Guard
const PrivateRoute = ({ children }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0b0f17] flex items-center justify-center">
        <div className="w-10 h-10 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return user ? children : <Navigate to="/login" />;
};

function AppRoutes() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { incomingNotification, setIncomingNotification, incomingMessage, setIncomingMessage } = useSocket();
  const [toast, setToast] = React.useState(null);

  React.useEffect(() => {
    if (incomingNotification) {
      if (window.location.pathname !== '/notifications') {
        let bodyText = '';
        const senderName = incomingNotification.sender?.name || 'Someone';
        if (incomingNotification.type === 'like') bodyText = `${senderName} liked your publication.`;
        else if (incomingNotification.type === 'comment') bodyText = `${senderName} commented on your publication.`;
        else if (incomingNotification.type === 'follow') bodyText = `${senderName} started following you.`;
        else if (incomingNotification.type === 'friend_request') bodyText = `${senderName} sent you a friend request.`;
        else if (incomingNotification.type === 'friend_accept') bodyText = `${senderName} accepted your friend request.`;
        else if (incomingNotification.type === 'post') bodyText = `${senderName} published a new publication.`;
        else if (incomingNotification.type === 'tuition') bodyText = `${senderName} posted a new tuition update.`;
        else if (incomingNotification.type === 'job') bodyText = `${senderName} posted a new job listing.`;
        else bodyText = 'You have a new notification.';

        setToast({
          type: 'notification',
          title: 'Alert',
          body: bodyText,
          link: '/notifications'
        });

        // Auto hide
        const timer = setTimeout(() => setToast(null), 4000);
        return () => clearTimeout(timer);
      }
    }
  }, [incomingNotification]);

  React.useEffect(() => {
    if (incomingMessage) {
      const queryParams = new URLSearchParams(window.location.search);
      const isViewingThisChat = window.location.pathname === '/chat' && queryParams.get('userId') === incomingMessage.sender;
      
      if (!isViewingThisChat) {
        const bodyText = incomingMessage.text || 'Sent you a direct message.';
        
        setToast({
          type: 'message',
          title: 'New Message',
          body: bodyText,
          link: `/chat?userId=${incomingMessage.sender}`
        });

        // Auto hide
        const timer = setTimeout(() => setToast(null), 4000);
        return () => clearTimeout(timer);
      }
    }
  }, [incomingMessage]);

  return (
    <div className="min-h-screen bg-[#0b0f17] flex flex-col relative">
      {user && <Navbar />}

      {/* Real-time floating toast notifier */}
      {toast && (
        <div 
          onClick={() => {
            navigate(toast.link);
            setToast(null);
          }}
          className="fixed top-20 right-4 z-50 max-w-sm w-full bg-[#111827]/90 backdrop-blur-md border border-emerald-500/30 hover:border-emerald-500/50 shadow-2xl rounded-2xl p-4 flex gap-3 items-start cursor-pointer transition-all hover:scale-[1.02] active:scale-[0.98] animate-slideInRight"
        >
          <div className="p-2 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-xl shrink-0">
            {toast.type === 'message' ? <MessageSquare className="w-5 h-5" /> : <Bell className="w-5 h-5" />}
          </div>
          <div className="flex-1 min-w-0">
            <h4 className="text-xs font-black uppercase tracking-widest text-emerald-400">{toast.title}</h4>
            <p className="text-sm text-gray-200 mt-1 truncate">{toast.body}</p>
            <p className="text-[10px] text-gray-500 mt-1 font-medium">Click to view details</p>
          </div>
          <button 
            onClick={(e) => {
              e.stopPropagation();
              setToast(null);
            }}
            className="text-gray-500 hover:text-gray-300 p-0.5 rounded-lg cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      <main className="flex-1 w-full max-w-7xl mx-auto px-4">
        <Routes>
          {/* Public routes */}
          <Route path="/login" element={!user ? <Login /> : <Navigate to="/" />} />
          <Route path="/register" element={!user ? <Register /> : <Navigate to="/" />} />

          {/* Protected routes */}
          <Route path="/" element={<PrivateRoute><Feed /></PrivateRoute>} />
          <Route path="/profile" element={<PrivateRoute><Profile /></PrivateRoute>} />
          <Route path="/profile/:id" element={<PrivateRoute><Profile /></PrivateRoute>} />
          <Route path="/communities" element={<PrivateRoute><Communities /></PrivateRoute>} />
          <Route path="/blood" element={<PrivateRoute><BloodDonor /></PrivateRoute>} />
          <Route path="/tuition" element={<PrivateRoute><Tuition /></PrivateRoute>} />
          <Route path="/jobs" element={<PrivateRoute><Jobs /></PrivateRoute>} />
          <Route path="/notices" element={<PrivateRoute><NoticeBoard /></PrivateRoute>} />
          <Route path="/chat" element={<PrivateRoute><Chat /></PrivateRoute>} />
          <Route path="/search" element={<PrivateRoute><Search /></PrivateRoute>} />
          <Route path="/notifications" element={<PrivateRoute><Notifications /></PrivateRoute>} />

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </main>
    </div>
  );
}

export default function App() {
  return (
    <Router>
      <AuthProvider>
        <SocketProvider>
          <AppRoutes />
        </SocketProvider>
      </AuthProvider>
    </Router>
  );
}
