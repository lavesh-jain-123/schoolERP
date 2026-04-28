const express = require('express');
const router = express.Router();
const { uploadStudentPhoto, deleteStudentPhoto } = require('../controllers/uploadController');
const { upload } = require('../config/cloudinary');
const { protect, checkPermission } = require('../middleware/auth');

router.post(
  '/student-photo',
  protect,
  checkPermission('canAddStudents'),
  upload.single('photo'),
  uploadStudentPhoto
);

router.delete(
  '/student-photo',
  protect,
  checkPermission('canEditStudents'),
  deleteStudentPhoto
);

module.exports = router;