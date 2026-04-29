const express = require('express');
const router = express.Router();
const {
  parentLogin,
  requestOTP,
  getChildren,
  getStudentFees,
  getPendingFees,
} = require('../controllers/parentController');
const { protect } = require('../middleware/auth');

// Public routes
router.post('/login', parentLogin);
router.post('/request-otp', requestOTP);

// Protected routes
router.use(protect);
router.get('/children', getChildren);
router.get('/children/:id/fees', getStudentFees);
router.get('/children/:id/pending-fees', getPendingFees);

module.exports = router;