const mongoose = require('mongoose');

const feePaymentSchema = new mongoose.Schema(
  {
    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Student',
      required: true,
      index: true,
    },
    receiptNo: { type: String, unique: true },
    feeType: {
      type: String,
      enum: ['Tuition', 'Transport', 'Exam', 'Admission', 'Library', 'Other'],
      default: 'Tuition',
    },
    amount: { type: Number, required: true, min: 1 },
    month: { type: String }, // e.g. "April 2026"
    academicYear: { type: String }, // e.g. "2025-26"
    paymentDate: { type: Date, default: Date.now },
    paymentMode: {
      type: String,
      enum: ['Cash', 'UPI', 'Card', 'Cheque', 'Bank Transfer'],
      default: 'Cash',
    },
    transactionId: { type: String, trim: true },
    remarks: { type: String, trim: true },
    smsStatus: {
      type: String,
      enum: ['Pending', 'Sent', 'Failed', 'Not Sent'],
      default: 'Pending',
    },
    smsSentAt: { type: Date },
    smsError: { type: String },
    collectedBy: { type: String, default: 'admin' },
  },
  { timestamps: true }
);

// Auto-generate receipt number: RCP/2026/00001
feePaymentSchema.pre('validate', async function (next) {
  if (this.isNew && !this.receiptNo) {
    const year = new Date().getFullYear();
    const count = await mongoose.model('FeePayment').countDocuments({
      createdAt: {
        $gte: new Date(`${year}-01-01`),
        $lt: new Date(`${year + 1}-01-01`),
      },
    });
    this.receiptNo = `RCP/${year}/${String(count + 1).padStart(5, '0')}`;
  }
  next();
});

module.exports = mongoose.model('FeePayment', feePaymentSchema);