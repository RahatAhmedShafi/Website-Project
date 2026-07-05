import React, { useState, useEffect, useRef } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import { Send, MessageSquare, User, Smile, Shield } from 'lucide-react';

export default function Chat() {
  const { user: currentUser, getHeaders, getFriends } = useAuth();
  const { incomingMessage, setIncomingMessage } = useSocket();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  // Selected chat partner ID (if any)
  const targetUserId = searchParams.get('userId');

  const [chatUsers, setChatUsers] = useState([]);
  const [friends, setFriends] = useState([]);
  const [activeTab, setActiveTab] = useState('chats'); // 'chats' | 'friends'
  const [activePartner, setActivePartner] = useState(null);
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState('');
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [loadingUsers, setLoadingUsers] = useState(true);

  const messagesEndRef = useRef(null);

  // Auto-scroll to bottom of chat
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Fetch unique chat partners list
  const fetchChatUsers = async () => {
    try {
      const res = await fetch('/api/messages/chat-users', { headers: getHeaders() });
      if (res.ok) {
        const list = await res.json();
        setChatUsers(list);

        // If targetUserId URL parameter is specified, check if they are in the list
        if (targetUserId) {
          const exists = list.find(u => u._id === targetUserId);
          if (exists) {
            setActivePartner(exists);
          } else {
            // Fetch their user profile details since we have never messaged them yet
            const userRes = await fetch(`/api/auth/users/${targetUserId}`, { headers: getHeaders() });
            if (userRes.ok) {
              const partnerUser = await userRes.json();
              setActivePartner(partnerUser);
              setChatUsers(prev => [partnerUser, ...prev]);
            }
          }
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingUsers(false);
    }
  };

  // Fetch conversation history with active partner
  const fetchMessageHistory = async () => {
    if (!activePartner) return;
    try {
      setLoadingHistory(true);
      const res = await fetch(`/api/messages/${activePartner._id}`, { headers: getHeaders() });
      if (res.ok) {
        const history = await res.json();
        setMessages(history);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingHistory(false);
    }
  };

  const fetchFriends = async () => {
    try {
      const list = await getFriends();
      setFriends(list);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchChatUsers();
    fetchFriends();
  }, [targetUserId]);

  useEffect(() => {
    fetchMessageHistory();
  }, [activePartner]);

  // Handle incoming real-time socket messages
  useEffect(() => {
    if (incomingMessage) {
      const isFromActivePartner = activePartner && incomingMessage.sender.toString() === activePartner._id;
      
      if (isFromActivePartner) {
        // Append to history
        setMessages(prev => [...prev, incomingMessage]);
        
        // Mark as read
        fetch(`/api/messages/${activePartner._id}`, { headers: getHeaders() }); 
      } else {
        // Highlight or refresh chat partners list
        fetchChatUsers();
      }
      
      // Clear socket message buffer
      setIncomingMessage(null);
    }
  }, [incomingMessage, activePartner]);

  // Submit new direct message
  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!text.trim() || !activePartner) return;

    const messageText = text;
    setText(''); // instant clear for responsiveness

    try {
      const res = await fetch('/api/messages', {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({
          recipient: activePartner._id,
          text: messageText
        })
      });

      if (res.ok) {
        const savedMessage = await res.json();
        setMessages(prev => [...prev, savedMessage]);
        
        // Update sidebar latest message
        setChatUsers(chatUsers.map(u => {
          if (u._id === activePartner._id) {
            return { ...u, latestMessage: savedMessage };
          }
          return u;
        }));
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleSelectPartner = (partner) => {
    setActivePartner(partner);
    navigate(`/chat?userId=${partner._id}`);
  };

  return (
    <div className="max-w-6xl mx-auto py-6 px-4 h-[84vh] flex gap-4">
      
      {/* Sidebar - Threads list */}
      <div className="w-full md:w-80 glass-panel rounded-3xl p-4 border border-white/5 flex flex-col justify-between overflow-hidden">
        <div className="space-y-4 overflow-hidden flex flex-col flex-1">
          <h2 className="text-lg font-extrabold text-white flex items-center gap-2">
            <MessageSquare className="w-5 h-5 text-emerald-400" />
            <span>Conversations</span>
          </h2>

          {/* Tabs */}
          <div className="flex gap-2 p-1 bg-white/5 rounded-2xl shrink-0">
            <button 
              onClick={() => setActiveTab('chats')}
              className={`flex-1 text-[11px] font-bold py-2 rounded-xl transition-all cursor-pointer ${
                activeTab === 'chats' 
                  ? 'bg-emerald-600 text-white' 
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              Recent
            </button>
            <button 
              onClick={() => setActiveTab('friends')}
              className={`flex-1 text-[11px] font-bold py-2 rounded-xl transition-all cursor-pointer ${
                activeTab === 'friends' 
                  ? 'bg-emerald-600 text-white' 
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              Friends ({friends.length})
            </button>
          </div>

          <div className="overflow-y-auto flex-1 space-y-2 pr-1">
            {activeTab === 'chats' ? (
              loadingUsers ? (
                <p className="text-center text-xs text-gray-500 py-6">Loading conversations...</p>
              ) : chatUsers.length === 0 ? (
                <p className="text-center text-xs text-gray-500 py-8">No chats active yet.</p>
              ) : (
                chatUsers.map((threadUser) => {
                  const isActive = activePartner && activePartner._id === threadUser._id;
                  return (
                    <button
                      key={threadUser._id}
                      onClick={() => handleSelectPartner(threadUser)}
                      className={`w-full text-left p-3 rounded-2xl flex items-center gap-3 transition-all border cursor-pointer ${
                        isActive 
                          ? 'bg-emerald-500/10 border-emerald-500/20 text-white' 
                          : 'bg-[#111827]/40 border-transparent hover:bg-white/5 text-gray-400 hover:text-white'
                      }`}
                    >
                      {threadUser.profilePicture ? (
                        <img src={threadUser.profilePicture} alt={threadUser.name} className="w-10 h-10 rounded-full object-cover shrink-0" />
                      ) : (
                        <div className="w-10 h-10 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold uppercase shrink-0">
                          {threadUser.name.charAt(0)}
                        </div>
                      )}
                      <div className="flex-1 overflow-hidden">
                        <div className="flex justify-between items-center">
                          <span className="font-bold text-xs truncate max-w-[120px]">{threadUser.name}</span>
                          {threadUser.latestMessage && (
                            <span className="text-[9px] text-gray-500 shrink-0">
                              {new Date(threadUser.latestMessage.createdAt).toLocaleDateString()}
                            </span>
                          )}
                        </div>
                        <p className="text-[10px] text-gray-500 truncate mt-0.5">
                          {threadUser.latestMessage ? threadUser.latestMessage.text : 'Click to send message'}
                        </p>
                      </div>
                    </button>
                  );
                })
              )
            ) : (
              friends.length === 0 ? (
                <p className="text-center text-xs text-gray-500 py-8">No friends added yet.</p>
              ) : (
                friends.map((friend) => {
                  const isActive = activePartner && activePartner._id === friend._id;
                  return (
                    <button
                      key={friend._id}
                      onClick={() => handleSelectPartner(friend)}
                      className={`w-full text-left p-3 rounded-2xl flex items-center gap-3 transition-all border cursor-pointer ${
                        isActive 
                          ? 'bg-emerald-500/10 border-emerald-500/20 text-white' 
                          : 'bg-[#111827]/40 border-transparent hover:bg-white/5 text-gray-400 hover:text-white'
                      }`}
                    >
                      {friend.profilePicture ? (
                        <img src={friend.profilePicture} alt={friend.name} className="w-10 h-10 rounded-full object-cover shrink-0" />
                      ) : (
                        <div className="w-10 h-10 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold uppercase shrink-0">
                          {friend.name.charAt(0)}
                        </div>
                      )}
                      <div className="flex-1 overflow-hidden">
                        <div className="flex justify-between items-center">
                          <span className="font-bold text-xs truncate">{friend.name}</span>
                        </div>
                        <p className="text-[10px] text-gray-500 truncate mt-0.5">
                          {friend.university || friend.district || 'Vibora Connection'}
                        </p>
                      </div>
                    </button>
                  );
                })
              )
            )}
          </div>
        </div>
      </div>

      {/* Main chat details viewport */}
      <div className="flex-1 glass-panel rounded-3xl border border-white/5 flex flex-col overflow-hidden relative bg-[#111827]/20">
        {activePartner ? (
          <>
            {/* Chat header */}
            <div className="p-4 border-b border-white/5 flex items-center gap-3 bg-[#0b0f17]/40">
              {activePartner.profilePicture ? (
                <img src={activePartner.profilePicture} alt={activePartner.name} className="w-10 h-10 rounded-full object-cover" />
              ) : (
                <div className="w-10 h-10 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold uppercase">
                  {activePartner.name.charAt(0)}
                </div>
              )}
              <div>
                <h3 className="font-bold text-white text-sm">{activePartner.name}</h3>
                <p className="text-[10px] text-emerald-400">Secure connection active</p>
              </div>
            </div>

            {/* Message Stream */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {loadingHistory ? (
                <p className="text-center text-xs text-gray-500 py-6">Loading messages history...</p>
              ) : messages.length === 0 ? (
                <p className="text-center text-xs text-gray-500 py-8">Send a greeting message to start chatting!</p>
              ) : (
                messages.map((msg) => {
                  const isOwn = msg.sender.toString() === currentUser?._id;
                  return (
                    <div 
                      key={msg._id}
                      className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}
                    >
                      <div className={`max-w-[70%] p-3 rounded-2xl text-xs leading-relaxed border ${
                        isOwn 
                          ? 'bg-emerald-600 border-emerald-500 text-white rounded-br-none' 
                          : 'bg-[#111827] border-white/5 text-gray-200 rounded-bl-none'
                      }`}>
                        <p>{msg.text}</p>
                        <p className={`text-[8px] text-right mt-1 ${isOwn ? 'text-emerald-200' : 'text-gray-500'}`}>
                          {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </p>
                      </div>
                    </div>
                  );
                })
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input footer form */}
            <form onSubmit={handleSendMessage} className="p-4 border-t border-white/5 flex gap-2 bg-[#0b0f17]/40">
              <input
                type="text"
                placeholder="Type a message..."
                value={text}
                onChange={(e) => setText(e.target.value)}
                className="flex-1 bg-[#111827] border border-white/10 rounded-2xl px-4 py-2.5 text-xs text-gray-200 focus:outline-none focus:border-emerald-500/50"
              />
              <button
                type="submit"
                disabled={!text.trim()}
                className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold p-3 rounded-2xl transition-colors disabled:opacity-50"
              >
                <Send className="w-4.5 h-4.5" />
              </button>
            </form>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-center p-6 text-gray-500">
            <MessageSquare className="w-12 h-12 mb-3 text-gray-600 animate-pulse-slow" />
            <h3 className="font-bold text-gray-300">No Conversation Selected</h3>
            <p className="text-xs text-gray-500 max-w-xs mt-1">Select a partner from the sidebar or click "Message" on any user profile page to initiate chat.</p>
          </div>
        )}
      </div>

    </div>
  );
}
