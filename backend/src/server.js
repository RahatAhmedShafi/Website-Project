require('dotenv').config();
const express = require('express');
const http = require('http');
const WebSocket = require('ws');
const cors = require('cors');
const path = require('path');
const url = require('url');
const jwt = require('jsonwebtoken');

const { connectDB } = require('./config/db');
const { registerModels } = require('./models/schemas');
const wsManager = require('./utils/wsManager');

const JWT_SECRET = process.env.JWT_SECRET || 'vibora_bangladesh_local_secret_key_12345';

const app = express();
const server = http.createServer(app);

// Initialize database
registerModels();
connectDB();

// Middleware
app.use(cors());
app.use(express.json({ limit: '10mb' })); // Support base64 image uploads

// Test Route
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', time: new Date() });
});

// Mount Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/posts', require('./routes/posts'));
app.use('/api/communities', require('./routes/communities'));
app.use('/api/utilities', require('./routes/utilities'));
app.use('/api/notifications', require('./routes/notifications'));
app.use('/api/search', require('./routes/search'));
app.use('/api/messages', require('./routes/messages'));

// Serve frontend build static files in production if needed
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, '../../frontend/dist')));
  app.get('*', (req, res) => {
    res.sendFile(path.resolve(__dirname, '../../frontend', 'dist', 'index.html'));
  });
}

// Setup WebSocket Server
const wss = new WebSocket.Server({ noServer: true });

wss.on('connection', (ws, req, userId) => {
  wsManager.clients.set(userId, ws);
  console.log(`User connected to WS. Total active: ${wsManager.clients.size}`);

  ws.on('message', (message) => {
    try {
      const parsed = JSON.parse(message);
      console.log(`Received WS message from user ${userId}:`, parsed);
      
      // Simple heartbeat/ping pong
      if (parsed.type === 'ping') {
        ws.send(JSON.stringify({ type: 'pong' }));
      }
    } catch (err) {
      console.error('Error handling WS message:', err);
    }
  });

  ws.on('close', () => {
    wsManager.clients.delete(userId);
    console.log(`User disconnected from WS. Total active: ${wsManager.clients.size}`);
  });

  ws.on('error', (err) => {
    console.error(`WS error for user ${userId}:`, err);
    wsManager.clients.delete(userId);
  });
});

// Handle upgrade from HTTP to WS
server.on('upgrade', (request, socket, head) => {
  const parsedUrl = url.parse(request.url, true);
  const token = parsedUrl.query.token;

  if (!token) {
    socket.write('HTTP/1.1 401 Unauthorized\r\n\r\n');
    socket.destroy();
    return;
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    const userId = decoded.id;
    
    wss.handleUpgrade(request, socket, head, (ws) => {
      wss.emit('connection', ws, request, userId);
    });
  } catch (err) {
    socket.write('HTTP/1.1 401 Unauthorized\r\n\r\n');
    socket.destroy();
  }
});

// Run Server
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`Vibora Backend Server running on port ${PORT}`);
});
