const express = require('express');
const router = express.Router();
const c = require('../controllers/studentController');
const { protect, checkPermission } = require('../middleware/auth');

// All routes require authentication
router.use(protect);

router
  .route('/')
  .get(checkPermission('canViewStudents'), c.getStudents)
  .post(checkPermission('canAddStudents'), c.createStudent);

router.get('/pending-fees', checkPermission('canViewPendingFees'), c.getStudentsWithPendingFees);
router.post('/:id/send-pending-sms', checkPermission('canSendFeeReminders'), c.sendPendingFeeSms);

router
  .route('/:id')
  .get(checkPermission('canViewStudents'), c.getStudent)
  .put(checkPermission('canEditStudents'), c.updateStudent)
  .delete(checkPermission('canDeleteStudents'), c.deleteStudent);

module.exports = router;