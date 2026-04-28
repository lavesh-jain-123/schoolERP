const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const multer = require('multer');

console.log('Configuring Cloudinary...');
console.log('Cloud Name:', process.env.CLOUDINARY_CLOUD_NAME || 'NOT SET');
console.log('API Key:', process.env.CLOUDINARY_API_KEY ? 'SET' : 'NOT SET');
console.log('API Secret:', process.env.CLOUDINARY_API_SECRET ? 'SET' : 'NOT SET');

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Configure Multer Storage for Cloudinary
const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'school-erp/students',
    allowed_formats: ['jpg', 'jpeg', 'png', 'webp', 'gif'],
    transformation: [
      { width: 500, height: 500, crop: 'limit' },
      { quality: 'auto' }
    ],
  },
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
  fileFilter: (req, file, cb) => {
    console.log('Multer fileFilter - File:', {
      fieldname: file.fieldname,
      originalname: file.originalname,
      mimetype: file.mimetype,
    });

    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'), false);
    }
  },
});

console.log('✅ Cloudinary and Multer configured');

module.exports = { cloudinary, upload };