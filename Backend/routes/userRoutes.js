const express = require('express');
const router = express.Router();
const c = require('../controllers/userController');
const { protect, checkPermission } = require('../middleware/auth');

// All user routes require authentication and canManageUsers permission
router.use(protect, checkPermission('canManageUsers'));

router.route('/').get(c.getUsers).post(c.createUser);
router.route('/:id').get(c.getUser).put(c.updateUser).delete(c.deleteUser);

module.exports = router;