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

// @route   GET api/search/recommendations
// @desc    Get recommended friends/users (not followed yet, sorted by shared university/district)
router.get('/recommendations', authMiddleware, async (req, res) => {
  try {
    const currentUserId = req.user.id;
    const currentUser = await db.findById('users', currentUserId);
    if (!currentUser) {
      return res.status(404).json({ message: 'User not found' });
    }

    const following = currentUser.following || [];
    
    // Get all users
    const allUsers = await db.find('users');

    // Filter out:
    // 1. Current user
    // 2. Users current user is already following
    let recommendations = allUsers.filter(u => 
      u._id.toString() !== currentUserId &&
      !following.some(f => f.toString() === u._id.toString())
    );

    // Score based on local proximity matches
    recommendations = recommendations.map(u => {
      let score = 0;
      if (currentUser.university && u.university && u.university.toLowerCase() === currentUser.university.toLowerCase()) {
        score += 3;
      }
      if (currentUser.district && u.district && u.district.toLowerCase() === currentUser.district.toLowerCase()) {
        score += 2;
      }
      return { ...u, score };
    });

    // Sort by match score descending, then take top 5
    recommendations.sort((a, b) => b.score - a.score);
    const topRecs = recommendations.slice(0, 5).map(({ password, ...u }) => u);

    res.json(topRecs);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error fetching recommendations' });
  }
});

module.exports = router;
