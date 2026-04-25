const mongoose = require('mongoose');

const studentSchema = new mongoose.Schema(
  {
    admissionNo: {
      type: String,
      required: true,
      unique: true,
      uppercase: true,
      trim: true,
    },
    firstName: { type: String, required: true, trim: true },
    lastName: { type: String, trim: true, default: '' },
    dob: { type: Date },
    gender: { type: String, enum: ['Male', 'Female', 'Other'] },
    className: { type: String, required: true, trim: true }, // e.g. "5"
    section: { type: String, default: 'A', trim: true },
    rollNo: { type: String, trim: true },
    parentName: { type: String, required: true, trim: true },
    parentMobile: {
      type: String,
      required: true,
      match: [/^[6-9]\d{9}$/, 'Enter a valid 10-digit Indian mobile number'],
    },
    parentEmail: { type: String, lowercase: true, trim: true },
    address: { type: String, trim: true },
    admissionDate: { type: Date, default: Date.now },
    monthlyFee: { type: Number, default: 0, min: 0 },
    status: {
      type: String,
      enum: ['Active', 'Inactive'],
      default: 'Active',
    },
  },
  { timestamps: true }
);

studentSchema.virtual('fullName').get(function () {
  return `${this.firstName} ${this.lastName}`.trim();
});

studentSchema.set('toJSON', { virtuals: true });

module.exports = mongoose.model('Student', studentSchema);