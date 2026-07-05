import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from './AuthContext';

const SocketContext = createContext(null);

export const useSocket = () => useContext(SocketContext);

export const SocketProvider = ({ children }) => {
  const { token, user } = useAuth();
  const [socket, setSocket] = useState(null);
  const [incomingMessage, setIncomingMessage] = useState(null);
  const [incomingNotification, setIncomingNotification] = useState(null);

  useEffect(() => {
    if (!token || !user) {
      if (socket) {
        socket.close();
        setSocket(null);
      }
      return;
    }

    // Determine WS protocol and URL
    let wsUrl;
    const configuredWsUrl = import.meta.env.VITE_WS_URL;
    if (configuredWsUrl) {
      const separator = configuredWsUrl.includes('?') ? '&' : '?';
      wsUrl = `${configuredWsUrl}${separator}token=${token}`;
    } else {
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      wsUrl = process.env.NODE_ENV === 'production' 
        ? `${protocol}//${window.location.host}?token=${token}`
        : `ws://localhost:5000?token=${token}`;
    }

    console.log(`Establishing WebSocket connection to ${wsUrl}`);
    const ws = new WebSocket(wsUrl);

    ws.onopen = () => {
      console.log('WebSocket Connection Opened');
      // Start heartbeat
      const heartbeat = setInterval(() => {
        if (ws.readyState === WebSocket.OPEN) {
          ws.send(JSON.stringify({ type: 'ping' }));
        }
      }, 30000);
      ws.heartbeatInterval = heartbeat;
    };

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        
        if (data.type === 'chat_message') {
          setIncomingMessage(data.message);
        } else if (data.type === 'notification') {
          setIncomingNotification(data.notification);
        }
      } catch (err) {
        console.error('Error parsing WebSocket message:', err);
      }
    };

    ws.onclose = () => {
      console.log('WebSocket Connection Closed');
      if (ws.heartbeatInterval) clearInterval(ws.heartbeatInterval);
    };

    ws.onerror = (err) => {
      console.error('WebSocket Error:', err);
    };

    setSocket(ws);

    return () => {
      ws.close();
      if (ws.heartbeatInterval) clearInterval(ws.heartbeatInterval);
    };
  }, [token, user]);

  return (
    <SocketContext.Provider value={{ socket, incomingMessage, setIncomingMessage, incomingNotification, setIncomingNotification }}>
      {children}
    </SocketContext.Provider>
  );
};
