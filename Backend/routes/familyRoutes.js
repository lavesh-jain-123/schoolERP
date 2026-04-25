const express = require('express');
const router = express.Router();
const c = require('../controllers/familyController');
const { protect, checkPermission } = require('../middleware/auth');

router.use(protect);

router
  .route('/')
  .get(checkPermission('canViewFamilies'), c.getFamilies)
  .post(checkPermission('canManageFamilies'), c.createFamily);

router.post('/:id/add-student', checkPermission('canManageFamilies'), c.addStudentToFamily);
router.post('/:id/remove-student', checkPermission('canManageFamilies'), c.removeStudentFromFamily);

router
  .route('/:id')
  .get(checkPermission('canViewFamilies'), c.getFamily)
  .put(checkPermission('canManageFamilies'), c.updateFamily)
  .delete(checkPermission('canManageFamilies'), c.deleteFamily);

module.exports = router;