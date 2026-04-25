require('dotenv').config({ path: '../.env' });
const mongoose = require('mongoose');
const User = require('../models/User');

async function update() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('MongoDB connected');

    // Update all admin users
    const result = await User.updateMany(
      { role: 'admin' },
      { 
        $set: { 
          'permissions.canViewFamilies': true,
          'permissions.canManageFamilies': true
        } 
      }
    );

    console.log(`✅ Updated ${result.modifiedCount} admin user(s)`);
    process.exit(0);
  } catch (err) {
    console.error('Error:', err);
    process.exit(1);
  }
}

update();