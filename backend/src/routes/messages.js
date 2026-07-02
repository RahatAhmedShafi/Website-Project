const express = require('express');
const router = express.Router();
const { db } = require('../config/db');
const authMiddleware = require('../middleware/auth');
const wsManager = require('../utils/wsManager');

// @route   GET api/messages/chat-users
// @desc    Get list of unique users the current user has chatted with
router.get('/chat-users', authMiddleware, async (req, res) => {
  try {
    const currentUserId = req.user.id;
    
    // Find all messages involving the current user
    const messages = await db.find('messages', {
      $or: [
        { sender: currentUserId },
        { recipient: currentUserId }
      ]
    }, { sort: { createdAt: -1 } });

    // Extract unique user IDs
    const chattedUserIds = new Set();
    messages.forEach(msg => {
      if (msg.sender.toString() !== currentUserId) chattedUserIds.add(msg.sender.toString());
      if (msg.recipient.toString() !== currentUserId) chattedUserIds.add(msg.recipient.toString());
    });

    const userPromises = Array.from(chattedUserIds).map(async (id) => {
      const u = await db.findById('users', id);
      if (u) {
        const { password, ...safeUser } = u;
        
        // Find latest message between currentUser and this user
        const latestMsg = messages.find(m => 
          (m.sender.toString() === currentUserId && m.recipient.toString() === id) ||
          (m.sender.toString() === id && m.recipient.toString() === currentUserId)
        );
        return {
          ...safeUser,
          latestMessage: latestMsg
        };
      }
      return null;
    });

    const chatUsers = (await Promise.all(userPromises)).filter(Boolean);
    res.json(chatUsers);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error listing chat partners' });
  }
});

// @route   GET api/messages/:userId
// @desc    Get conversation history with a specific user
router.get('/:userId', authMiddleware, async (req, res) => {
  try {
    const currentUserId = req.user.id;
    const otherUserId = req.params.userId;

    const list = await db.find('messages', {
      $or: [
        { sender: currentUserId, recipient: otherUserId },
        { sender: otherUserId, recipient: currentUserId }
      ]
    }, { sort: { createdAt: 1 } });

    // Mark incoming messages as read
    await db.updateMany('messages', { sender: otherUserId, recipient: currentUserId, read: false }, { read: true });

    res.json(list);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error fetching message history' });
  }
});

// @route   POST api/messages
// @desc    Send a direct message
router.post('/', authMiddleware, async (req, res) => {
  const { recipient, text } = req.body;

  try {
    if (!recipient || !text) {
      return res.status(400).json({ message: 'Recipient and text are required' });
    }

    const newMessage = await db.create('messages', {
      sender: req.user.id,
      recipient,
      text,
      read: false
    });

    // Send via WebSocket if connected
    wsManager.sendToUser(recipient, {
      type: 'chat_message',
      message: newMessage
    });

    res.status(201).json(newMessage);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error sending message' });
  }
});

module.exports = router;
