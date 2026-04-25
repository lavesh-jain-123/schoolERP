const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema(
  {
    username: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    password: {
      type: String,
      required: true,
      minlength: 6,
      select: false, // Don't return password by default
    },
    fullName: {
      type: String,
      required: true,
      trim: true,
    },
    role: {
      type: String,
      enum: ['admin', 'student_entry', 'fee_collector', 'custom'],
      default: 'custom',
    },
    // Granular permissions for custom roles
    permissions: {
      // Student permissions
      canViewStudents: { type: Boolean, default: false },
      canAddStudents: { type: Boolean, default: false },
      canEditStudents: { type: Boolean, default: false },
      canDeleteStudents: { type: Boolean, default: false },
      
      // Fee permissions
      canViewFees: { type: Boolean, default: false },
      canCollectFees: { type: Boolean, default: false },
      canDeleteFees: { type: Boolean, default: false },
      canViewPendingFees: { type: Boolean, default: false },
      canSendFeeReminders: { type: Boolean, default: false },
      
      // User management (admin only)
      canManageUsers: { type: Boolean, default: false },
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    lastLogin: {
      type: Date,
    },
  },
  { timestamps: true }
);

// Hash password before saving
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

// Method to check password
userSchema.methods.comparePassword = async function (candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

// Auto-assign permissions based on role
userSchema.pre('save', function (next) {
  if (this.role === 'admin') {
    Object.keys(this.permissions.toObject()).forEach(key => {
      this.permissions[key] = true;
    });
  } else if (this.role === 'student_entry') {
    this.permissions = {
      canViewStudents: true,
      canAddStudents: true,
      canEditStudents: false,
      canDeleteStudents: false,
      canViewFees: false,
      canCollectFees: false,
      canDeleteFees: false,
      canViewPendingFees: false,
      canSendFeeReminders: false,
      canManageUsers: false,
    };
  } else if (this.role === 'fee_collector') {
    this.permissions = {
      canViewStudents: true,
      canAddStudents: false,
      canEditStudents: false,
      canDeleteStudents: false,
      canViewFees: true,
      canCollectFees: true,
      canDeleteFees: false,
      canViewPendingFees: true,
      canSendFeeReminders: true,
      canManageUsers: false,
    };
  }
  next();
});

module.exports = mongoose.model('User', userSchema);