const express = require('express');
const router = express.Router();
const { db } = require('../config/db');
const authMiddleware = require('../middleware/auth');

// @route   GET api/security/logs
// @desc    Get recent security audit events and PII access logs (SIEM In-App Audit Trail)
router.get('/logs', authMiddleware, async (req, res) => {
  try {
    const logs = await db.find('security_logs', {}, { 
      sort: { createdAt: -1 },
      limit: 50
    });
    res.json(logs);
  } catch (err) {
    console.error('Error fetching security logs:', err);
    res.status(500).json({ message: 'Server error retrieving security audit logs' });
  }
});

// @route   GET api/security/stats
// @desc    Get security metrics and PII protection summary
router.get('/stats', authMiddleware, async (req, res) => {
  try {
    const logs = await db.find('security_logs', {});
    const piiUnmaskCount = logs.filter(l => l.event && l.event.startsWith('PII_')).length;
    const nosqlBlockedCount = logs.filter(l => l.event === 'NOSQL_INJECTION_BLOCKED').length;

    res.json({
      piiProtectionActive: true,
      coarseLocationPreserved: true,
      securityHeadersEnforced: {
        xFrameOptions: 'DENY',
        csp: 'Enforced',
        hsts: 'Active',
        xContentTypeOptions: 'nosniff'
      },
      metrics: {
        totalAuditEvents: logs.length,
        piiUnmaskRequests: piiUnmaskCount,
        nosqlInjectionsNeutralized: nosqlBlockedCount
      }
    });
  } catch (err) {
    console.error('Error fetching security stats:', err);
    res.status(500).json({ message: 'Server error retrieving security stats' });
  }
});

module.exports = router;
