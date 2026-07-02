const express = require('express');
const router = express.Router();
const { db } = require('../config/db');
const authMiddleware = require('../middleware/auth');

// Seed default communities if they don't exist
async function seedDefaultCommunities(userId) {
  const defaults = [
    { name: 'Dhaka Community', slug: 'dhaka-community', description: 'Local updates, news, and announcements for people in Dhaka.', category: 'Local' },
    { name: 'CSE Students', slug: 'cse-students', description: 'Hub for Computer Science and Engineering students in Bangladesh universities.', category: 'Education' },
    { name: 'Freelancers Bangladesh', slug: 'freelancers-bangladesh', description: 'Freelancing discussions, client tips, and job postings.', category: 'Career' },
    { name: 'Blood Donation Group', slug: 'blood-donation-group', description: 'Request urgent blood donation or register to support others in Bangladesh.', category: 'Social Action' }
  ];

  for (let c of defaults) {
    const exists = await db.findOne('communities', { slug: c.slug });
    if (!exists) {
      await db.create('communities', {
        name: c.name,
        slug: c.slug,
        description: c.description,
        category: c.category,
        members: [userId],
        createdBy: userId
      });
    }
  }
}

// @route   GET api/communities
// @desc    Get all communities (seeds defaults if table empty)
router.get('/', authMiddleware, async (req, res) => {
  try {
    let list = await db.find('communities');
    if (list.length === 0) {
      await seedDefaultCommunities(req.user.id);
      list = await db.find('communities');
    }
    res.json(list);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error listing communities' });
  }
});

// @route   POST api/communities
// @desc    Create a new community
router.post('/', authMiddleware, async (req, res) => {
  const { name, description, category } = req.body;

  try {
    if (!name) {
      return res.status(400).json({ message: 'Community name is required' });
    }

    const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
    const exists = await db.findOne('communities', { slug });
    if (exists) {
      return res.status(400).json({ message: 'A community with similar name already exists' });
    }

    const newCommunity = await db.create('communities', {
      name,
      slug,
      description: description || '',
      category: category || 'General',
      members: [req.user.id],
      createdBy: req.user.id
    });

    res.status(201).json(newCommunity);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error creating community' });
  }
});

// @route   POST api/communities/:id/join
// @desc    Join or leave a community
router.post('/:id/join', authMiddleware, async (req, res) => {
  try {
    const community = await db.findById('communities', req.params.id);
    if (!community) {
      return res.status(404).json({ message: 'Community not found' });
    }

    const members = community.members || [];
    const isMember = members.some(id => id.toString() === req.user.id);

    let updatedCommunity;
    if (isMember) {
      // Leave
      updatedCommunity = await db.findByIdAndUpdate('communities', req.params.id, { $pull: { members: req.user.id } });
    } else {
      // Join
      updatedCommunity = await db.findByIdAndUpdate('communities', req.params.id, { $push: { members: req.user.id } });
    }

    res.json({ members: updatedCommunity.members });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error joining community' });
  }
});

// @route   GET api/communities/:slug
// @desc    Get community by slug
router.get('/:slug', authMiddleware, async (req, res) => {
  try {
    const community = await db.findOne('communities', { slug: req.params.slug });
    if (!community) {
      return res.status(404).json({ message: 'Community not found' });
    }
    res.json(community);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error fetching community' });
  }
});

module.exports = router;
