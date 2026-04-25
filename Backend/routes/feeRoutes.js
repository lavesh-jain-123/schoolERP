const express = require('express');
const router = express.Router();
const c = require('../controllers/feeController');
const { protect, checkPermission } = require('../middleware/auth');

// All routes require authentication
router.use(protect);

router
  .route('/')
  .get(checkPermission('canViewFees'), c.getFees)
  .post(checkPermission('canCollectFees'), c.collectFee);

router.get('/unpaid-months/:studentId', checkPermission('canCollectFees'), c.getUnpaidMonths);

router
  .route('/:id')
  .get(checkPermission('canViewFees'), c.getFee)
  .delete(checkPermission('canDeleteFees'), c.deleteFee);

router.post('/:id/resend-sms', checkPermission('canCollectFees'), c.resendSms);

module.exports = router;