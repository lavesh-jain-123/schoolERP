const express = require('express');
const router = express.Router();
const c = require('../controllers/familyController');
const { protect, checkPermission } = require('../middleware/auth');

router.use(protect);

router
  .route('/')
  .get(checkPermission('canViewStudents'), c.getFamilies)
  .post(checkPermission('canAddStudents'), c.createFamily);

router.post('/:id/add-student', checkPermission('canEditStudents'), c.addStudentToFamily);
router.post('/:id/remove-student', checkPermission('canEditStudents'), c.removeStudentFromFamily);

router
  .route('/:id')
  .get(checkPermission('canViewStudents'), c.getFamily)
  .put(checkPermission('canEditStudents'), c.updateFamily)
  .delete(checkPermission('canDeleteStudents'), c.deleteFamily);

module.exports = router;