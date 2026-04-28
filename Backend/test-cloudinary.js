require('dotenv').config();
const cloudinary = require('cloudinary').v2;

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

console.log('Testing Cloudinary configuration...');
console.log('Cloud Name:', process.env.CLOUDINARY_CLOUD_NAME);
console.log('API Key:', process.env.CLOUDINARY_API_KEY ? '***' + process.env.CLOUDINARY_API_KEY.slice(-4) : 'NOT SET');
console.log('API Secret:', process.env.CLOUDINARY_API_SECRET ? 'SET (hidden)' : 'NOT SET');

cloudinary.api.ping()
  .then(result => {
    console.log('✅ Cloudinary connected successfully!');
    console.log('Result:', result);
  })
  .catch(err => {
    console.error('❌ Cloudinary connection failed!');
    console.error('Error:', err.message);
  });