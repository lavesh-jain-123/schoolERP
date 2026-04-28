require('dotenv').config();
const cloudinary = require('cloudinary').v2;
const fs = require('fs');
const path = require('path');

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Test upload with a sample image
// First, create a simple test image or use an existing one
const testImagePath = path.join(__dirname, 'test-image.jpg');

// If you don't have a test image, download one or create a simple colored square
if (!fs.existsSync(testImagePath)) {
  console.log('❌ Create a test-image.jpg file in Backend folder first');
  process.exit(1);
}

console.log('Testing upload to Cloudinary...');

cloudinary.uploader.upload(testImagePath, {
  folder: 'school-erp/students',
})
  .then(result => {
    console.log('✅ Upload successful!');
    console.log('URL:', result.secure_url);
    console.log('Public ID:', result.public_id);
  })
  .catch(err => {
    console.error('❌ Upload failed!');
    console.error('Error:', err);
  });