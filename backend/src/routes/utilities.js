const express = require('express');
const router = express.Router();
const { db } = require('../config/db');
const authMiddleware = require('../middleware/auth');
const { createAndSendNotification } = require('../utils/notificationHelper');

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

      // Notify followers/friends of new tuition post
      const followers = userObj.followers || [];
      const friends = userObj.friends || [];
      const notifyUsers = Array.from(new Set([...followers, ...friends].map(id => id.toString())));
      for (const recipientId of notifyUsers) {
        await createAndSendNotification(recipientId, req.user.id, 'tuition', null);
      }
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

      // Notify followers/friends of new job post
      const followers = userObj.followers || [];
      const friends = userObj.friends || [];
      const notifyUsers = Array.from(new Set([...followers, ...friends].map(id => id.toString())));
      for (const recipientId of notifyUsers) {
        await createAndSendNotification(recipientId, req.user.id, 'job', null);
      }
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

// @route   PUT api/utilities/tuition/:id
// @desc    Update a tuition post (must be the owner)
router.put('/tuition/:id', authMiddleware, async (req, res) => {
  const { title, type, subjects, district, area, salary, details, phone } = req.body;

  try {
    const post = await db.findById('tuition_posts', req.params.id);
    if (!post) {
      return res.status(404).json({ message: 'Tuition listing not found' });
    }

    const postOwnerId = post.user && post.user._id ? post.user._id.toString() : (post.user ? post.user.toString() : '');
    if (postOwnerId !== req.user.id) {
      return res.status(403).json({ message: 'Unauthorized to update this tuition post' });
    }

    const updateData = {};
    if (title !== undefined) updateData.title = title;
    if (type !== undefined) updateData.type = type;
    if (subjects !== undefined) updateData.subjects = Array.isArray(subjects) ? subjects : [subjects];
    if (district !== undefined) updateData.district = district;
    if (area !== undefined) updateData.area = area;
    if (salary !== undefined) updateData.salary = salary;
    if (details !== undefined) updateData.details = details;
    if (phone !== undefined) updateData.phone = phone;

    const updated = await db.findByIdAndUpdate('tuition_posts', req.params.id, updateData, { new: true });
    
    const populated = await db.findById('tuition_posts', updated._id);
    const userObj = await db.findById('users', req.user.id);
    if (userObj) {
      const { password, ...safeUser } = userObj;
      populated.user = safeUser;
    }

    res.json(populated);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error updating tuition listing' });
  }
});

// @route   DELETE api/utilities/tuition/:id
// @desc    Delete a tuition post (must be the owner)
router.delete('/tuition/:id', authMiddleware, async (req, res) => {
  try {
    const post = await db.findById('tuition_posts', req.params.id);
    if (!post) {
      return res.status(404).json({ message: 'Tuition listing not found' });
    }

    const postOwnerId = post.user && post.user._id ? post.user._id.toString() : (post.user ? post.user.toString() : '');
    if (postOwnerId !== req.user.id) {
      return res.status(403).json({ message: 'Unauthorized to delete this tuition post' });
    }

    await db.findByIdAndDelete('tuition_posts', req.params.id);
    res.json({ message: 'Tuition listing deleted successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error deleting tuition listing' });
  }
});

// @route   PUT api/utilities/jobs/:id
// @desc    Update a job posting (must be the owner)
router.put('/jobs/:id', authMiddleware, async (req, res) => {
  const { companyName, title, type, description, requirements, salary, link } = req.body;

  try {
    const job = await db.findById('jobs', req.params.id);
    if (!job) {
      return res.status(404).json({ message: 'Job posting not found' });
    }

    const jobOwnerId = job.user && job.user._id ? job.user._id.toString() : (job.user ? job.user.toString() : '');
    if (jobOwnerId !== req.user.id) {
      return res.status(403).json({ message: 'Unauthorized to update this job posting' });
    }

    const updateData = {};
    if (companyName !== undefined) updateData.companyName = companyName;
    if (title !== undefined) updateData.title = title;
    if (type !== undefined) updateData.type = type;
    if (description !== undefined) updateData.description = description;
    if (requirements !== undefined) updateData.requirements = requirements;
    if (salary !== undefined) updateData.salary = salary;
    if (link !== undefined) updateData.link = link;

    const updated = await db.findByIdAndUpdate('jobs', req.params.id, updateData, { new: true });
    
    const populated = await db.findById('jobs', updated._id);
    const userObj = await db.findById('users', req.user.id);
    if (userObj) {
      const { password, ...safeUser } = userObj;
      populated.user = safeUser;
    }

    res.json(populated);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error updating job posting' });
  }
});

// @route   DELETE api/utilities/jobs/:id
// @desc    Delete a job posting (must be the owner)
router.delete('/jobs/:id', authMiddleware, async (req, res) => {
  try {
    const job = await db.findById('jobs', req.params.id);
    if (!job) {
      return res.status(404).json({ message: 'Job posting not found' });
    }

    const jobOwnerId = job.user && job.user._id ? job.user._id.toString() : (job.user ? job.user.toString() : '');
    if (jobOwnerId !== req.user.id) {
      return res.status(403).json({ message: 'Unauthorized to delete this job posting' });
    }

    await db.findByIdAndDelete('jobs', req.params.id);
    res.json({ message: 'Job posting deleted successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error deleting job posting' });
  }
});

module.exports = router;
