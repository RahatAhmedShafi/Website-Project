const express = require('express');
const router = express.Router();
const { db } = require('../config/db');
const authMiddleware = require('../middleware/auth');

// @route   GET api/search
// @desc    Global search for posts, communities, and users
router.get('/', authMiddleware, async (req, res) => {
  const { q } = req.query;

  try {
    if (!q) {
      return res.json({ users: [], posts: [], communities: [] });
    }

    const searchRegex = { $regex: q, $options: 'i' };

    // Search Users
    const users = await db.find('users', {
      $or: [
        { name: searchRegex },
        { university: searchRegex },
        { district: searchRegex }
      ]
    }, { limit: 10 });
    
    // Omit passwords from users results
    const safeUsers = users.map(({ password, ...u }) => u);

    // Search Communities
    const communities = await db.find('communities', {
      $or: [
        { name: searchRegex },
        { description: searchRegex }
      ]
    }, { limit: 10 });

    // Search Posts
    const posts = await db.find('posts', {
      text: searchRegex
    }, { 
      sort: { createdAt: -1 },
      limit: 20,
      populate: ['user']
    });

    res.json({
      users: safeUsers,
      communities,
      posts
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error during search' });
  }
});

module.exports = router;
