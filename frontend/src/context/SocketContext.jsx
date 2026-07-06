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

    let ws;
    let heartbeat;
    let reconnectTimeout;
    let isClosed = false;

    const connect = () => {
      if (isClosed) return;

      // Determine WS protocol and URL
      let wsUrl;
      const configuredWsUrl = import.meta.env.VITE_WS_URL;
      if (configuredWsUrl) {
        const separator = configuredWsUrl.includes('?') ? '&' : '?';
        wsUrl = `${configuredWsUrl}${separator}token=${token}`;
      } else {
        wsUrl = import.meta.env.PROD 
          ? `wss://website-project-1s5f.onrender.com?token=${token}`
          : `ws://localhost:5000?token=${token}`;
      }

      console.log(`Establishing WebSocket connection to ${wsUrl}`);
      ws = new WebSocket(wsUrl);

      ws.onopen = () => {
        console.log('WebSocket Connection Opened');
        // Start heartbeat
        heartbeat = setInterval(() => {
          if (ws.readyState === WebSocket.OPEN) {
            ws.send(JSON.stringify({ type: 'ping' }));
          }
        }, 30000);
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
        console.log('WebSocket Connection Closed. Reconnecting in 3 seconds...');
        if (heartbeat) clearInterval(heartbeat);
        if (!isClosed) {
          reconnectTimeout = setTimeout(connect, 3000);
        }
      };

      ws.onerror = (err) => {
        console.error('WebSocket Error:', err);
        ws.close();
      };

      setSocket(ws);
    };

    connect();

    return () => {
      isClosed = true;
      if (ws) ws.close();
      if (heartbeat) clearInterval(heartbeat);
      if (reconnectTimeout) clearTimeout(reconnectTimeout);
    };
  }, [token, user]);

  return (
    <SocketContext.Provider value={{ socket, incomingMessage, setIncomingMessage, incomingNotification, setIncomingNotification }}>
      {children}
    </SocketContext.Provider>
  );
};
