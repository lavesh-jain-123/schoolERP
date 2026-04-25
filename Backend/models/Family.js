const mongoose = require('mongoose');

const familySchema = new mongoose.Schema(
  {
    familyId: {
      type: String,
      required: true,
      unique: true,
      uppercase: true,
      trim: true,
    },
    parentName: {
      type: String,
      required: true,
      trim: true,
    },
    parentMobile: {
      type: String,
      required: true,
      match: [/^[6-9]\d{9}$/, 'Enter a valid 10-digit Indian mobile number'],
    },
    parentEmail: {
      type: String,
      lowercase: true,
      trim: true,
    },
    address: {
      type: String,
      trim: true,
    },
    // Track all students in this family
    students: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Student',
    }],
  },
  { timestamps: true }
);

// Auto-generate family ID: FAM/2026/00001
familySchema.pre('validate', async function (next) {
  if (this.isNew && !this.familyId) {
    const year = new Date().getFullYear();
    const count = await mongoose.model('Family').countDocuments({
      createdAt: {
        $gte: new Date(`${year}-01-01`),
        $lt: new Date(`${year + 1}-01-01`),
      },
    });
    this.familyId = `FAM/${year}/${String(count + 1).padStart(5, '0')}`;
  }
  next();
});

module.exports = mongoose.model('Family', familySchema);