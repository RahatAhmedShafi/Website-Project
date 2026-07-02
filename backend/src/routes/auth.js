const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { db } = require('../config/db');
const authMiddleware = require('../middleware/auth');

const JWT_SECRET = process.env.JWT_SECRET || 'vibora_bangladesh_local_secret_key_12345';

// @route   POST api/auth/register
// @desc    Register a user
router.post('/register', async (req, res) => {
  const { name, email, password, university, district } = req.body;

  try {
    if (!name || !email || !password) {
      return res.status(400).json({ message: 'Please enter all required fields' });
    }

    // Check if user exists
    const userExists = await db.findOne('users', { email: email.toLowerCase() });
    if (userExists) {
      return res.status(400).json({ message: 'User already exists' });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Create user
    const newUser = await db.create('users', {
      name,
      email: email.toLowerCase(),
      password: hashedPassword,
      university: university || '',
      district: district || '',
      skills: [],
      bio: '',
      profilePicture: '',
      followers: [],
      following: []
    });

    // Create JWT token
    const token = jwt.sign({ id: newUser._id }, JWT_SECRET, { expiresIn: '7d' });

    const { password: _, ...userSafe } = newUser;
    res.status(201).json({ token, user: userSafe });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error during registration' });
  }
});

// @route   POST api/auth/login
// @desc    Authenticate user & get token
router.post('/login', async (req, res) => {
  const { email, password } = req.body;

  try {
    if (!email || !password) {
      return res.status(400).json({ message: 'Please enter all fields' });
    }

    // Check user
    const user = await db.findOne('users', { email: email.toLowerCase() });
    if (!user) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    // Check password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    // Create token
    const token = jwt.sign({ id: user._id }, JWT_SECRET, { expiresIn: '7d' });

    const { password: _, ...userSafe } = user;
    res.json({ token, user: userSafe });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error during login' });
  }
});

// @route   POST api/auth/google
// @desc    Simulate Google OAuth and register/login
router.post('/google', async (req, res) => {
  const { name, email, googleId, imageUrl } = req.body;

  try {
    if (!email || !name) {
      return res.status(400).json({ message: 'Invalid Google login payload' });
    }

    let user = await db.findOne('users', { email: email.toLowerCase() });

    if (!user) {
      // Create user if not exists
      const dummyPassword = await bcrypt.hash(googleId || 'google_dummy_pass_' + Math.random(), 10);
      user = await db.create('users', {
        name,
        email: email.toLowerCase(),
        password: dummyPassword,
        university: '',
        district: '',
        skills: [],
        bio: 'Signed in via Google',
        profilePicture: imageUrl || '',
        followers: [],
        following: []
      });
    }

    const token = jwt.sign({ id: user._id }, JWT_SECRET, { expiresIn: '7d' });
    const { password: _, ...userSafe } = user;
    res.json({ token, user: userSafe });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error during Google sign-in' });
  }
});

// @route   GET api/auth/me
// @desc    Get current user profile
router.get('/me', authMiddleware, async (req, res) => {
  try {
    const user = await db.findById('users', req.user.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    const { password: _, ...userSafe } = user;
    res.json(userSafe);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error fetching user session' });
  }
});

// @route   PUT api/auth/profile
// @desc    Update profile
router.put('/profile', authMiddleware, async (req, res) => {
  const { name, university, district, skills, bio, profilePicture } = req.body;
  try {
    const updateData = {};
    if (name !== undefined) updateData.name = name;
    if (university !== undefined) updateData.university = university;
    if (district !== undefined) updateData.district = district;
    if (skills !== undefined) updateData.skills = skills;
    if (bio !== undefined) updateData.bio = bio;
    if (profilePicture !== undefined) updateData.profilePicture = profilePicture;

    const updatedUser = await db.findByIdAndUpdate('users', req.user.id, updateData, { new: true });
    const { password: _, ...userSafe } = updatedUser;
    res.json(userSafe);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error updating profile' });
  }
});

// @route   GET api/auth/users/:id
// @desc    Get user by ID
router.get('/users/:id', authMiddleware, async (req, res) => {
  try {
    const targetUser = await db.findById('users', req.params.id);
    if (!targetUser) {
      return res.status(404).json({ message: 'User not found' });
    }
    const { password: _, ...userSafe } = targetUser;
    res.json(userSafe);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error fetching user profile' });
  }
});

// @route   POST api/auth/users/:id/follow
// @desc    Follow/unfollow a user
router.post('/users/:id/follow', authMiddleware, async (req, res) => {
  try {
    if (req.user.id === req.params.id) {
      return res.status(400).json({ message: 'You cannot follow yourself' });
    }

    const targetUser = await db.findById('users', req.params.id);
    const currentUser = await db.findById('users', req.user.id);

    if (!targetUser || !currentUser) {
      return res.status(404).json({ message: 'User not found' });
    }

    const followers = targetUser.followers || [];
    const following = currentUser.following || [];

    const isFollowing = followers.some(id => id.toString() === req.user.id);

    if (isFollowing) {
      // Unfollow
      await db.findByIdAndUpdate('users', req.params.id, { $pull: { followers: req.user.id } });
      await db.findByIdAndUpdate('users', req.user.id, { $pull: { following: req.params.id } });
      res.json({ followed: false });
    } else {
      // Follow
      await db.findByIdAndUpdate('users', req.params.id, { $push: { followers: req.user.id } });
      await db.findByIdAndUpdate('users', req.user.id, { $push: { following: req.params.id } });
      
      // Create notification
      await db.create('notifications', {
        recipient: req.params.id,
        sender: req.user.id,
        type: 'follow',
        post: null,
        read: false
      });

      res.json({ followed: true });
    }
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error during follow operation' });
  }
});

module.exports = router;
