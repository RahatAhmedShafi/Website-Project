const express = require('express');
const router = express.Router();
const { db } = require('../config/db');
const authMiddleware = require('../middleware/auth');

// ==========================================
// 🩸 BLOOD DONOR ROUTING
// ==========================================

// @route   POST api/utilities/blood/register
// @desc    Register or update blood donor profile
router.post('/blood/register', authMiddleware, async (req, res) => {
  const { name, bloodGroup, district, phone, available } = req.body;

  try {
    if (!name || !bloodGroup || !district || !phone) {
      return res.status(400).json({ message: 'Name, Blood Group, District and Phone are required' });
    }

    // Check if donor profile already exists for user
    const existingDonor = await db.findOne('blood_donors', { user: req.user.id });

    let donorProfile;
    if (existingDonor) {
      donorProfile = await db.findByIdAndUpdate('blood_donors', existingDonor._id, {
        name,
        bloodGroup,
        district,
        phone,
        available: available !== undefined ? available : true
      }, { new: true });
    } else {
      donorProfile = await db.create('blood_donors', {
        user: req.user.id,
        name,
        bloodGroup,
        district,
        phone,
        available: available !== undefined ? available : true
      });
    }

    res.status(201).json(donorProfile);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error registering blood donor' });
  }
});

// @route   GET api/utilities/blood/search
// @desc    Search/list blood donors with optional group and district filters
router.get('/blood/search', authMiddleware, async (req, res) => {
  const { bloodGroup, district, available } = req.query;

  try {
    const query = {};
    if (bloodGroup) query.bloodGroup = bloodGroup;
    if (district) query.district = district;
    if (available) query.available = available === 'true';

    const donors = await db.find('blood_donors', query, { sort: { updatedAt: -1 } });
    res.json(donors);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error searching blood donors' });
  }
});

// @route   GET api/utilities/blood/me
// @desc    Get current user blood donor profile
router.get('/blood/me', authMiddleware, async (req, res) => {
  try {
    const profile = await db.findOne('blood_donors', { user: req.user.id });
    res.json(profile || null);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error fetching blood profile' });
  }
});

// ==========================================
// 🎓 TUITION MARKETPLACE ROUTING
// ==========================================

// @route   POST api/utilities/tuition
// @desc    Create a tuition post (either tutor profile or student request)
router.post('/tuition', authMiddleware, async (req, res) => {
  const { type, title, subjects, district, area, salary, details, phone } = req.body;

  try {
    if (!type || !title || !district || !details || !phone) {
      return res.status(400).json({ message: 'Missing required tuition details' });
    }

    const post = await db.create('tuition_posts', {
      user: req.user.id,
      type, // 'tutor_profile' or 'student_request'
      title,
      subjects: Array.isArray(subjects) ? subjects : (subjects ? [subjects] : []),
      district,
      area: area || '',
      salary: salary || 'Negotiable',
      details,
      phone
    });

    const populated = await db.findById('tuition_posts', post._id);
    const userObj = await db.findById('users', req.user.id);
    if (userObj) {
      const { password, ...safeUser } = userObj;
      populated.user = safeUser;
    }

    res.status(201).json(populated);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error creating tuition post' });
  }
});

// @route   GET api/utilities/tuition
// @desc    Get/search tuition marketplace postings
router.get('/tuition', authMiddleware, async (req, res) => {
  const { type, district, subject } = req.query;

  try {
    const query = {};
    if (type) query.type = type;
    if (district) query.district = district;

    let list = await db.find('tuition_posts', query, { 
      sort: { createdAt: -1 }, 
      populate: ['user'] 
    });

    // Handle subject search filter manually if specified
    if (subject) {
      const subLower = subject.toLowerCase();
      list = list.filter(item => 
        (item.subjects || []).some(s => s.toLowerCase().includes(subLower))
      );
    }

    res.json(list);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error fetching tuition listings' });
  }
});

// ==========================================
// 💼 INTERNSHIP / JOB BOARD ROUTING
// ==========================================

// @route   POST api/utilities/jobs
// @desc    Create a job/internship posting
router.post('/jobs', authMiddleware, async (req, res) => {
  const { companyName, title, type, description, requirements, salary, link } = req.body;

  try {
    if (!companyName || !title || !type || !description || !requirements) {
      return res.status(400).json({ message: 'Missing required job posting details' });
    }

    const job = await db.create('jobs', {
      user: req.user.id,
      companyName,
      title,
      type, // 'Internship', 'Part-time', 'Remote', 'Full-time'
      description,
      requirements,
      salary: salary || 'Negotiable',
      link: link || ''
    });

    const populated = await db.findById('jobs', job._id);
    const userObj = await db.findById('users', req.user.id);
    if (userObj) {
      const { password, ...safeUser } = userObj;
      populated.user = safeUser;
    }

    res.status(201).json(populated);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error creating job posting' });
  }
});

// @route   GET api/utilities/jobs
// @desc    Get/search job postings
router.get('/jobs', authMiddleware, async (req, res) => {
  const { type, search } = req.query;

  try {
    const query = {};
    if (type) query.type = type;

    let list = await db.find('jobs', query, { 
      sort: { createdAt: -1 }, 
      populate: ['user'] 
    });

    if (search) {
      const q = search.toLowerCase();
      list = list.filter(item => 
        item.title.toLowerCase().includes(q) || 
        item.companyName.toLowerCase().includes(q) ||
        item.description.toLowerCase().includes(q)
      );
    }

    res.json(list);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error fetching job postings' });
  }
});

module.exports = router;
