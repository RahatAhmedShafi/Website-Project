const express = require('express');
const router = express.Router();
const { db } = require('../config/db');
const authMiddleware = require('../middleware/auth');

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
    if (community) filter.community = community;
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
        await db.create('notifications', {
          recipient: post.user,
          sender: req.user.id,
          type: 'like',
          post: post._id,
          read: false
        });
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
      await db.create('notifications', {
        recipient: post.user,
        sender: req.user.id,
        type: 'comment',
        post: post._id,
        read: false
      });
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

module.exports = router;
