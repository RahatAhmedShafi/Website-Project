const express = require('express');
const router = express.Router();
const { db } = require('../config/db');
const authMiddleware = require('../middleware/auth');
const { createAndSendNotification } = require('../utils/notificationHelper');

// @route   POST api/posts
// @desc    Create a post (text and/or image, optional community, noticeCategory if isNotice is true)
router.post('/', authMiddleware, async (req, res) => {
  const { text, image, community, isNotice, noticeCategory } = req.body;

  try {
    const newPost = await db.create('posts', {
      user: req.user.id,
      text: text || '',
      image: image || '',
      community: community || null,
      likes: [],
      commentsCount: 0,
      sharesCount: 0,
      isNotice: isNotice || false,
      noticeCategory: noticeCategory || ''
    });

    const populatedPost = await db.findById('posts', newPost._id);
    // Populate user
    const userObj = await db.findById('users', req.user.id);
    if (userObj) {
      const { password, ...safeUser } = userObj;
      populatedPost.user = safeUser;

      // Notify all followers/friends of new post activity
      const followers = userObj.followers || [];
      const friends = userObj.friends || [];
      const notifyUsers = Array.from(new Set([...followers, ...friends].map(id => id.toString())));
      for (const recipientId of notifyUsers) {
        await createAndSendNotification(recipientId, req.user.id, 'post', newPost._id);
      }
    }

    res.status(201).json(populatedPost);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error creating post' });
  }
});

// @route   GET api/posts
// @desc    Get all posts (optionally filtered by community, or notices only)
router.get('/', authMiddleware, async (req, res) => {
  const { community, isNotice, noticeCategory } = req.query;

  try {
    const filter = {};
    if (community) {
      filter.community = community;
    } else if (isNotice === undefined) {
      // Isolate community posts from global homepage feed
      filter.community = null;
    }
    if (isNotice !== undefined) filter.isNotice = isNotice === 'true';
    if (noticeCategory) filter.noticeCategory = noticeCategory;

    const posts = await db.find('posts', filter, { 
      sort: { createdAt: -1 }, 
      populate: ['user'] 
    });

    res.json(posts);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error fetching feed' });
  }
});

// @route   POST api/posts/:id/like
// @desc    Like or unlike a post
router.post('/:id/like', authMiddleware, async (req, res) => {
  try {
    const post = await db.findById('posts', req.params.id);
    if (!post) {
      return res.status(404).json({ message: 'Post not found' });
    }

    const likes = post.likes || [];
    const isLiked = likes.some(id => id.toString() === req.user.id);

    let updatedPost;
    if (isLiked) {
      // Unlike
      updatedPost = await db.findByIdAndUpdate('posts', req.params.id, { $pull: { likes: req.user.id } });
    } else {
      // Like
      updatedPost = await db.findByIdAndUpdate('posts', req.params.id, { $push: { likes: req.user.id } });
      
      // Create notification for post owner if it's not the current user
      if (post.user.toString() !== req.user.id) {
        await createAndSendNotification(post.user, req.user.id, 'like', post._id);
      }
    }

    res.json({ likes: updatedPost.likes });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error liking post' });
  }
});

// @route   GET api/posts/:id/comments
// @desc    Get comments for a post
router.get('/:id/comments', authMiddleware, async (req, res) => {
  try {
    const comments = await db.find('comments', { post: req.params.id }, { 
      sort: { createdAt: 1 }, 
      populate: ['user'] 
    });
    res.json(comments);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error fetching comments' });
  }
});

// @route   POST api/posts/:id/comment
// @desc    Add comment to a post
router.post('/:id/comment', authMiddleware, async (req, res) => {
  const { text } = req.body;

  try {
    if (!text) {
      return res.status(400).json({ message: 'Comment text is required' });
    }

    const post = await db.findById('posts', req.params.id);
    if (!post) {
      return res.status(404).json({ message: 'Post not found' });
    }

    const comment = await db.create('comments', {
      post: req.params.id,
      user: req.user.id,
      text
    });

    // Update comment count on post
    const currentCommentsCount = post.commentsCount || 0;
    await db.findByIdAndUpdate('posts', req.params.id, { commentsCount: currentCommentsCount + 1 });

    // Populate user
    const userObj = await db.findById('users', req.user.id);
    if (userObj) {
      const { password, ...safeUser } = userObj;
      comment.user = safeUser;
    }

    // Create notification for post owner if it's not the current user
    if (post.user.toString() !== req.user.id) {
      await createAndSendNotification(post.user, req.user.id, 'comment', post._id);
    }

    res.status(201).json(comment);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error adding comment' });
  }
});

// @route   POST api/posts/:id/share
// @desc    Simulate sharing a post (increment share count)
router.post('/:id/share', authMiddleware, async (req, res) => {
  try {
    const post = await db.findById('posts', req.params.id);
    if (!post) {
      return res.status(404).json({ message: 'Post not found' });
    }

    const currentSharesCount = post.sharesCount || 0;
    const updatedPost = await db.findByIdAndUpdate('posts', req.params.id, { sharesCount: currentSharesCount + 1 });
    res.json({ sharesCount: updatedPost.sharesCount });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error sharing post' });
  }
});

// @route   PUT api/posts/:id
// @desc    Update a post (must be the owner)
router.put('/:id', authMiddleware, async (req, res) => {
  const { text, image } = req.body;

  try {
    const post = await db.findById('posts', req.params.id);
    if (!post) {
      return res.status(404).json({ message: 'Post not found' });
    }

    // Check ownership
    const postOwnerId = post.user && post.user._id ? post.user._id.toString() : (post.user ? post.user.toString() : '');
    if (postOwnerId !== req.user.id) {
      return res.status(403).json({ message: 'Unauthorized to update this post' });
    }

    const updateData = {};
    if (text !== undefined) updateData.text = text;
    if (image !== undefined) updateData.image = image;

    const updatedPost = await db.findByIdAndUpdate('posts', req.params.id, updateData, { new: true });
    
    // Populate user
    const populated = await db.findById('posts', updatedPost._id);
    const userObj = await db.findById('users', req.user.id);
    if (userObj) {
      const { password, ...safeUser } = userObj;
      populated.user = safeUser;
    }

    res.json(populated);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error updating post' });
  }
});

// @route   DELETE api/posts/:id
// @desc    Delete a post (must be the owner)
router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    const post = await db.findById('posts', req.params.id);
    if (!post) {
      return res.status(404).json({ message: 'Post not found' });
    }

    // Check ownership
    const postOwnerId = post.user && post.user._id ? post.user._id.toString() : (post.user ? post.user.toString() : '');
    if (postOwnerId !== req.user.id) {
      return res.status(403).json({ message: 'Unauthorized to delete this post' });
    }

    await db.findByIdAndDelete('posts', req.params.id);
    
    // Clean up associated comments and notifications
    await db.deleteMany('comments', { post: req.params.id });
    await db.deleteMany('notifications', { post: req.params.id });

    res.json({ message: 'Post deleted successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error deleting post' });
  }
});

module.exports = router;
