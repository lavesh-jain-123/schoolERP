const { cloudinary } = require('../config/cloudinary');

// POST /api/upload/student-photo - Upload student photo
exports.uploadStudentPhoto = async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'No file uploaded' });
    }

    res.json({
      success: true,
      data: {
        url: req.file.path, // Cloudinary URL
        publicId: req.file.filename, // For deletion if needed
      },
    });
  } catch (err) {
    next(err);
  }
};

// DELETE /api/upload/student-photo - Delete student photo
exports.deleteStudentPhoto = async (req, res, next) => {
  try {
    const { publicId } = req.body;

    if (!publicId) {
      return res.status(400).json({ success: false, message: 'Public ID required' });
    }

    await cloudinary.uploader.destroy(publicId);

    res.json({ success: true, message: 'Photo deleted' });
  } catch (err) {
    next(err);
  }
};