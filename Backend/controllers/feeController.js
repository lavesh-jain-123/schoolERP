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

// POST /api/fees - Collect fee for one or multiple students (siblings)
exports.collectFee = async (req, res, next) => {
  try {
    const {
      studentIds,      // Array of student IDs for sibling payments
      studentId,       // Single student ID (backward compatible)
      amount,          // Single amount for all students (backward compatible)
      studentFees,     // NEW: Object with individual fees { studentId: amount }
      feeType,
      months,
      academicYear,
      paymentMode,
      transactionId,
      remarks,
      sendSms = true,
    } = req.body;

    // Support both single and multiple students
    const students = studentIds 
      ? await Student.find({ _id: { $in: studentIds } }).populate('family')
      : [await Student.findById(studentId).populate('family')];

    if (students.some(s => !s)) {
      return res.status(404).json({ success: false, message: 'One or more students not found' });
    }

    const monthsArray = Array.isArray(months) ? months : [months];
    const allCreatedPayments = [];
    let totalAmount = 0;
    
    // Track individual student totals for response
    const studentTotals = {};

    // Create payments for each student
    for (const student of students) {
      // Priority: studentFees[studentId] > amount > student.monthlyFee
      const studentAmount = 
        studentFees?.[student._id] ||  // Individual fee from new system
        amount ||                       // Shared amount (backward compatible)
        student.monthlyFee ||           // Student's default monthly fee
        0;

      // Validate fee amount
      if (studentAmount <= 0) {
        return res.status(400).json({ 
          success: false, 
          message: `Invalid fee amount for student ${student.firstName} ${student.lastName}` 
        });
      }

      const studentTotal = studentAmount * monthsArray.length;
      totalAmount += studentTotal;
      
      // Track for response
      studentTotals[student._id] = {
        name: `${student.firstName} ${student.lastName}`.trim(),
        admissionNo: student.admissionNo,
        amountPerMonth: studentAmount,
        monthsCount: monthsArray.length,
        totalAmount: studentTotal,
      };

      for (const month of monthsArray) {
        const payment = await FeePayment.create({
          student: student._id,
          amount: studentAmount,
          feeType,
          month,
          academicYear,
          paymentMode,
          transactionId,
          remarks: `${remarks || ''}${students.length > 1 ? ' [Family Payment]' : ''}`.trim(),
          smsStatus: sendSms ? 'Pending' : 'Not Sent',
        });
        allCreatedPayments.push(payment);
      }
    }

    // Send SMS - use family contact if available
    let smsResult = { success: false };
    if (sendSms && students.length > 0) {
      const firstStudent = students[0];
      const parentMobile = firstStudent.family?.parentMobile || firstStudent.parentMobile;
      const parentName = firstStudent.family?.parentName || firstStudent.parentName;

      if (parentMobile) {
        // Build SMS content
        let smsContent = '';
        
        if (students.length === 1) {
          // Single student SMS
          const studentName = `${firstStudent.firstName} ${firstStudent.lastName}`.trim();
          const monthsText = monthsArray.length === 1 
            ? monthsArray[0] 
            : `${monthsArray.join(', ')}`;
          
          smsContent = {
            parentMobile,
            parentName,
            studentName,
            amount: totalAmount,
            receiptNo: allCreatedPayments.map(p => p.receiptNo).join(', '),
            month: monthsText,
          };
        } else {
          // Multiple students SMS - use custom format
          const studentSummary = students.map(s => {
            const st = studentTotals[s._id];
            return `${st.name} (${st.admissionNo}): ₹${st.totalAmount.toLocaleString()}`;
          }).join('\n');
          
          const monthsText = monthsArray.length === 1 
            ? monthsArray[0] 
            : `${monthsArray.length} months (${monthsArray.slice(0, 2).join(', ')}${monthsArray.length > 2 ? '...' : ''})`;

          smsContent = {
            parentMobile,
            parentName,
            studentName: `${students.length} students:\n${studentSummary}`,
            amount: totalAmount,
            receiptNo: `${allCreatedPayments.length} receipts generated`,
            month: monthsText,
          };
        }

        smsResult = await sendFeePaymentSMS(smsContent);

        // Update SMS status
        const smsStatus = smsResult.success ? 'Sent' : 'Failed';
        const smsSentAt = smsResult.success ? new Date() : undefined;
        const smsError = smsResult.success ? undefined : smsResult.error;

        await FeePayment.updateMany(
          { _id: { $in: allCreatedPayments.map(p => p._id) } },
          { smsStatus, smsSentAt, smsError }
        );
      }
    }

    // Return summary
    const populated = await FeePayment.findById(allCreatedPayments[0]._id).populate(
      'student',
      'admissionNo firstName lastName className section parentName parentMobile'
    );

    res.status(201).json({
      success: true,
      data: {
        ...populated.toObject(),
        totalPayments: allCreatedPayments.length,
        totalStudents: students.length,
        totalAmount,
        allReceipts: allCreatedPayments.map(p => p.receiptNo),
        monthsCovered: monthsArray,
        studentsCovered: students.map(s => ({
          id: s._id,
          name: `${s.firstName} ${s.lastName}`.trim(),
          admissionNo: s.admissionNo,
          amountPerMonth: studentTotals[s._id].amountPerMonth,
          monthsCount: studentTotals[s._id].monthsCount,
          totalAmount: studentTotals[s._id].totalAmount,
        })),
        smsStatus: smsResult.success ? 'Sent' : (sendSms ? 'Failed' : 'Not Sent'),
        smsError: smsResult.error,
      },
    });
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
    const student = await Student.findById(req.params.studentId).populate('family');
    
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