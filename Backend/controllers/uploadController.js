const { cloudinary } = require('../config/cloudinary');

// POST /api/upload/student-photo - Upload student photo
exports.uploadStudentPhoto = async (req, res, next) => {
  try {
    console.log('=== Upload Request Received ===');
    console.log('Headers:', req.headers);
    console.log('File:', req.file);
    console.log('Body:', req.body);

    if (!req.file) {
      console.error('No file in request');
      return res.status(400).json({ 
        success: false, 
        message: 'No file uploaded',
        debug: {
          headers: req.headers,
          body: req.body,
        }
      });
    }

    console.log('File uploaded successfully:', {
      fieldname: req.file.fieldname,
      originalname: req.file.originalname,
      mimetype: req.file.mimetype,
      size: req.file.size,
      url: req.file.path,
      publicId: req.file.filename,
    });

    res.json({
      success: true,
      data: {
        url: req.file.path,
        publicId: req.file.filename,
      },
    });
  } catch (err) {
    console.error('=== Upload Error ===');
    console.error('Error:', err);
    console.error('Error message:', err.message);
    console.error('Error stack:', err.stack);
    
    res.status(500).json({
      success: false,
      message: err.message || 'Upload failed',
      error: err.toString(),
    });
  }
};

// DELETE /api/upload/student-photo - Delete student photo
exports.deleteStudentPhoto = async (req, res, next) => {
  try {
    const { publicId } = req.body;

    if (!publicId) {
      return res.status(400).json({ success: false, message: 'Public ID required' });
    }

    console.log('Deleting photo:', publicId);
    await cloudinary.uploader.destroy(publicId);
    console.log('Photo deleted successfully');

    res.json({ success: true, message: 'Photo deleted' });
  } catch (err) {
    console.error('Delete error:', err);
    res.status(500).json({
      success: false,
      message: err.message || 'Delete failed',
    });
  }
};