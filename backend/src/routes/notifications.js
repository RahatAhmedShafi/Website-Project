const express = require('express');
const router = express.Router();
const { db } = require('../config/db');
const authMiddleware = require('../middleware/auth');

// @route   GET api/notifications
// @desc    Get user notifications
router.get('/', authMiddleware, async (req, res) => {
  try {
    const list = await db.find('notifications', { recipient: req.user.id }, {
      sort: { createdAt: -1 },
      populate: ['sender', 'post']
    });
    res.json(list);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error fetching notifications' });
  }
});

// @route   PUT api/notifications/read
// @desc    Mark all user notifications as read
router.put('/read', authMiddleware, async (req, res) => {
  try {
    await db.updateMany('notifications', { recipient: req.user.id }, { read: true });
    res.json({ message: 'Notifications marked as read' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error updating notifications' });
  }
});

module.exports = router;
