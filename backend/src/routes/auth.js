const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { db } = require('../config/db');
const authMiddleware = require('../middleware/auth');
const { createAndSendNotification } = require('../utils/notificationHelper');

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
      await createAndSendNotification(req.params.id, req.user.id, 'follow', null);

      res.json({ followed: true });
    }
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error during follow operation' });
  }
});

// @route   POST api/auth/users/:id/friend-request
// @desc    Send or cancel friend request
router.post('/users/:id/friend-request', authMiddleware, async (req, res) => {
  try {
    if (req.user.id === req.params.id) {
      return res.status(400).json({ message: 'You cannot send a friend request to yourself' });
    }

    const targetUser = await db.findById('users', req.params.id);
    const currentUser = await db.findById('users', req.user.id);

    if (!targetUser || !currentUser) {
      return res.status(404).json({ message: 'User not found' });
    }

    const friends = currentUser.friends || [];
    const friendRequests = targetUser.friendRequests || [];
    const sentFriendRequests = currentUser.sentFriendRequests || [];

    if (friends.some(id => id.toString() === req.params.id)) {
      return res.status(400).json({ message: 'You are already friends' });
    }

    const hasRequested = sentFriendRequests.some(id => id.toString() === req.params.id);

    if (hasRequested) {
      // Cancel request
      await db.findByIdAndUpdate('users', req.params.id, { $pull: { friendRequests: req.user.id } });
      await db.findByIdAndUpdate('users', req.user.id, { $pull: { sentFriendRequests: req.params.id } });
      
      // Remove any existing friend request notification
      await db.deleteMany('notifications', {
        recipient: req.params.id,
        sender: req.user.id,
        type: 'friend_request'
      });

      res.json({ status: 'none' });
    } else {
      // Send request
      await db.findByIdAndUpdate('users', req.params.id, { $push: { friendRequests: req.user.id } });
      await db.findByIdAndUpdate('users', req.user.id, { $push: { sentFriendRequests: req.params.id } });
      
      // Create and send real-time notification
      await createAndSendNotification(req.params.id, req.user.id, 'friend_request', null);

      res.json({ status: 'sent' });
    }
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error during friend request operation' });
  }
});

// @route   POST api/auth/users/:id/accept-friend
// @desc    Accept friend request
router.post('/users/:id/accept-friend', authMiddleware, async (req, res) => {
  try {
    const targetUser = await db.findById('users', req.params.id);
    const currentUser = await db.findById('users', req.user.id);

    if (!targetUser || !currentUser) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Check if there is an incoming request from the target user
    const incomingRequests = currentUser.friendRequests || [];
    const hasRequest = incomingRequests.some(id => id.toString() === req.params.id);

    if (!hasRequest) {
      return res.status(400).json({ message: 'No friend request from this user' });
    }

    // Add to friends
    await db.findByIdAndUpdate('users', req.user.id, { 
      $push: { friends: req.params.id },
      $pull: { friendRequests: req.params.id }
    });
    await db.findByIdAndUpdate('users', req.params.id, { 
      $push: { friends: req.user.id },
      $pull: { sentFriendRequests: req.user.id }
    });

    // Remove the friend request notification
    await db.deleteMany('notifications', {
      recipient: req.user.id,
      sender: req.params.id,
      type: 'friend_request'
    });

    // Create and send accept notification
    await createAndSendNotification(req.params.id, req.user.id, 'friend_accept', null);

    res.json({ status: 'friends' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error accepting friend request' });
  }
});

// @route   POST api/auth/users/:id/decline-friend
// @desc    Decline friend request
router.post('/users/:id/decline-friend', authMiddleware, async (req, res) => {
  try {
    const targetUser = await db.findById('users', req.params.id);
    const currentUser = await db.findById('users', req.user.id);

    if (!targetUser || !currentUser) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Pull request
    await db.findByIdAndUpdate('users', req.user.id, { $pull: { friendRequests: req.params.id } });
    await db.findByIdAndUpdate('users', req.params.id, { $pull: { sentFriendRequests: req.user.id } });

    // Remove notification
    await db.deleteMany('notifications', {
      recipient: req.user.id,
      sender: req.params.id,
      type: 'friend_request'
    });

    res.json({ status: 'none' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error declining friend request' });
  }
});

// @route   POST api/auth/users/:id/unfriend
// @desc    Unfriend a user
router.post('/users/:id/unfriend', authMiddleware, async (req, res) => {
  try {
    const targetUser = await db.findById('users', req.params.id);
    const currentUser = await db.findById('users', req.user.id);

    if (!targetUser || !currentUser) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Pull from friends
    await db.findByIdAndUpdate('users', req.user.id, { $pull: { friends: req.params.id } });
    await db.findByIdAndUpdate('users', req.params.id, { $pull: { friends: req.user.id } });

    // Also remove notifications related to friendship between these users
    await db.deleteMany('notifications', {
      $or: [
        { recipient: req.user.id, sender: req.params.id, type: 'friend_accept' },
        { recipient: req.params.id, sender: req.user.id, type: 'friend_accept' }
      ]
    });

    res.json({ status: 'none' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error unfriending user' });
  }
});

// @route   GET api/auth/friends
// @desc    Get user's friends list
router.get('/friends', authMiddleware, async (req, res) => {
  try {
    const currentUser = await db.findById('users', req.user.id);
    if (!currentUser) {
      return res.status(404).json({ message: 'User not found' });
    }

    const friendsList = currentUser.friends || [];
    
    // Fetch details of all friends
    const friends = await db.find('users', {
      _id: { $in: friendsList }
    });

    const safeFriends = friends.map(({ password, ...u }) => u);
    res.json(safeFriends);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error fetching friends' });
  }
});

module.exports = router;
