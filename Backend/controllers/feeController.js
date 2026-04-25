const FeePayment = require('../models/FeePayment');
const Student = require('../models/Student');
const { sendFeePaymentSMS } = require('../utils/smsService');

// GET /api/fees?studentId=&month=&status=
exports.getFees = async (req, res, next) => {
  try {
    const { studentId, month, smsStatus } = req.query;
    const q = {};
    if (studentId) q.student = studentId;
    if (month) q.month = month;
    if (smsStatus) q.smsStatus = smsStatus;

    const fees = await FeePayment.find(q)
      .populate('student', 'admissionNo firstName lastName className section parentMobile parentName')
      .sort({ paymentDate: -1 });
    res.json({ success: true, count: fees.length, data: fees });
  } catch (err) {
    next(err);
  }
};

// GET /api/fees/:id
exports.getFee = async (req, res, next) => {
  try {
    const fee = await FeePayment.findById(req.params.id).populate('student');
    if (!fee)
      return res.status(404).json({ success: false, message: 'Not found' });
    res.json({ success: true, data: fee });
  } catch (err) {
    next(err);
  }
};

// POST /api/fees  — collect fee payment(s) and auto-send SMS
exports.collectFee = async (req, res, next) => {
  try {
    const {
      studentId,
      amount,
      feeType,
      months, // Now accepts array of months
      academicYear,
      paymentMode,
      transactionId,
      remarks,
      sendSms = true,
    } = req.body;

    const student = await Student.findById(studentId);
    if (!student)
      return res.status(404).json({ success: false, message: 'Student not found' });

    // If months is an array, create multiple payments (one per month)
    const monthsArray = Array.isArray(months) ? months : [months];
    const createdPayments = [];

    for (const month of monthsArray) {
      const payment = await FeePayment.create({
        student: student._id,
        amount,
        feeType,
        month,
        academicYear,
        paymentMode,
        transactionId,
        remarks,
        smsStatus: sendSms ? 'Pending' : 'Not Sent',
      });
      createdPayments.push(payment);
    }

    // Send SMS only once with total summary
    let smsResult = { success: false };
    if (sendSms) {
      const totalAmount = amount * monthsArray.length;
      const monthsText = monthsArray.length === 1 
        ? monthsArray[0] 
        : `${monthsArray.length} months (${monthsArray.join(', ')})`;

      smsResult = await sendFeePaymentSMS({
        parentMobile: student.parentMobile,
        parentName: student.parentName,
        studentName: `${student.firstName} ${student.lastName}`.trim(),
        amount: totalAmount,
        receiptNo: createdPayments.map(p => p.receiptNo).join(', '),
        month: monthsText,
      });

      // Update SMS status for all created payments
      const smsStatus = smsResult.success ? 'Sent' : 'Failed';
      const smsSentAt = smsResult.success ? new Date() : undefined;
      const smsError = smsResult.success ? undefined : smsResult.error;

      await FeePayment.updateMany(
        { _id: { $in: createdPayments.map(p => p._id) } },
        { smsStatus, smsSentAt, smsError }
      );
    }

    // Return the first payment with populated student data
    const populated = await FeePayment.findById(createdPayments[0]._id).populate(
      'student',
      'admissionNo firstName lastName className section parentName parentMobile'
    );

    // Add summary info
    const responseData = {
      ...populated.toObject(),
      totalPayments: createdPayments.length,
      allReceipts: createdPayments.map(p => p.receiptNo),
      monthsCovered: monthsArray,
    };

    res.status(201).json({ success: true, data: responseData });
  } catch (err) {
    next(err);
  }
};


// POST /api/fees/:id/resend-sms — retry SMS for an existing receipt
exports.resendSms = async (req, res, next) => {
  try {
    const payment = await FeePayment.findById(req.params.id).populate('student');
    if (!payment)
      return res.status(404).json({ success: false, message: 'Not found' });

    const s = payment.student;
    const result = await sendFeePaymentSMS({
      parentMobile: s.parentMobile,
      parentName: s.parentName,
      studentName: `${s.firstName} ${s.lastName}`.trim(),
      amount: payment.amount,
      receiptNo: payment.receiptNo,
      month: payment.month,
    });

    payment.smsStatus = result.success ? 'Sent' : 'Failed';
    payment.smsSentAt = result.success ? new Date() : payment.smsSentAt;
    payment.smsError = result.success ? undefined : result.error;
    await payment.save();

    res.json({ success: result.success, data: payment, error: result.error });
  } catch (err) {
    next(err);
  }
};

// DELETE /api/fees/:id
exports.deleteFee = async (req, res, next) => {
  try {
    const fee = await FeePayment.findByIdAndDelete(req.params.id);
    if (!fee)
      return res.status(404).json({ success: false, message: 'Not found' });
    res.json({ success: true, message: 'Payment deleted' });
  } catch (err) {
    next(err);
  }
};

// GET /api/fees/unpaid-months/:studentId
exports.getUnpaidMonths = async (req, res, next) => {
  try {
    const student = await Student.findById(req.params.studentId);
    if (!student) {
      return res.status(404).json({ success: false, message: 'Student not found' });
    }

    // Get all paid months for this student (Tuition only)
    const paidPayments = await FeePayment.find({
      student: student._id,
      feeType: 'Tuition',
    }).select('month');

    const paidMonths = new Set(paidPayments.map(p => p.month).filter(Boolean));

    // Calculate expected months from admission to now
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth();

    // Academic year: April to March
    let academicYearStart = new Date(currentYear, 3, 1); // April 1st
    if (currentMonth < 3) { // Before April = previous academic year
      academicYearStart.setFullYear(currentYear - 1);
    }

    const admissionDate = new Date(student.admissionDate || academicYearStart);
    const startDate = admissionDate > academicYearStart ? admissionDate : academicYearStart;

    // Generate all months from startDate to now
    const allMonths = [];
    const current = new Date(startDate);
    while (current <= now) {
      const monthStr = current.toLocaleString('en-US', { month: 'long', year: 'numeric' });
      allMonths.push(monthStr);
      current.setMonth(current.getMonth() + 1);
    }

    // Filter out paid months
    const unpaidMonths = allMonths.filter(m => !paidMonths.has(m));

    res.json({ success: true, data: unpaidMonths });
  } catch (err) {
    next(err);
  }
};