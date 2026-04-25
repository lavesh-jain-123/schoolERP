const Student = require('../models/Student');
const FeePayment = require('../models/FeePayment');
const Family = require('../models/Family'); // ADD THIS
// GET /api/students?search=&className=&status=
exports.getStudents = async (req, res, next) => {
  try {
    const { search, className, status } = req.query;
    const q = {};
    if (className) q.className = className;
    if (status) q.status = status;
    if (search) {
      const rx = new RegExp(search, 'i');
      q.$or = [
        { firstName: rx },
        { lastName: rx },
        { admissionNo: rx },
        { parentMobile: rx },
      ];
    }
    const students = await Student.find(q).sort({ createdAt: -1 });
    res.json({ success: true, count: students.length, data: students });
  } catch (err) {
    next(err);
  }
};

// GET /api/students/:id
// GET /api/students/:id - Get single student
exports.getStudent = async (req, res, next) => {
  try {
    const student = await Student.findById(req.params.id)
      .populate({
        path: 'family',
        populate: {
          path: 'students',
          select: 'admissionNo firstName lastName className section monthlyFee status'
        }
      });
    
    if (!student) {
      return res.status(404).json({ success: false, message: 'Student not found' });
    }
    
    res.json({ success: true, data: student });
  } catch (err) {
    next(err);
  }
};

// POST /api/students
exports.createStudent = async (req, res, next) => {
  try {
    const student = await Student.create(req.body);
    
    // If family is specified, add student to family's students array
    if (student.family) {
      await Family.findByIdAndUpdate(
        student.family,
        { $addToSet: { students: student._id } } // $addToSet prevents duplicates
      );
    }
    
    res.status(201).json({ success: true, data: student });
  } catch (err) {
    if (err.code === 11000) {
      return res.status(400).json({
        success: false,
        message: 'Admission number already exists',
      });
    }
    next(err);
  }
};
// PUT /api/students/:id
exports.updateStudent = async (req, res, next) => {
  try {
    const oldStudent = await Student.findById(req.params.id);
    
    if (!oldStudent) {
      return res.status(404).json({ success: false, message: 'Student not found' });
    }
    
    const oldFamily = oldStudent.family;
    const newFamily = req.body.family;
    
    // Update student
    const student = await Student.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );
    
    // Sync family relationships
    if (oldFamily && oldFamily.toString() !== newFamily?.toString()) {
      // Remove from old family
      await Family.findByIdAndUpdate(
        oldFamily,
        { $pull: { students: student._id } }
      );
    }
    
    if (newFamily && oldFamily?.toString() !== newFamily.toString()) {
      // Add to new family
      await Family.findByIdAndUpdate(
        newFamily,
        { $addToSet: { students: student._id } }
      );
    }
    
    res.json({ success: true, data: student });
  } catch (err) {
    next(err);
  }
};

// DELETE /api/students/:id - Delete student
exports.deleteStudent = async (req, res, next) => {
  try {
    const student = await Student.findById(req.params.id);
    
    if (!student) {
      return res.status(404).json({ success: false, message: 'Student not found' });
    }
    
    // Remove from family if linked
    if (student.family) {
      await Family.findByIdAndUpdate(
        student.family,
        { $pull: { students: student._id } }
      );
    }
    
    await student.deleteOne();
    
    res.json({ success: true, message: 'Student deleted' });
  } catch (err) {
    next(err);
  }
};

// GET /api/students/pending-fees
exports.getStudentsWithPendingFees = async (req, res, next) => {
  try {
    const { className, section, search, minPending } = req.query;
    
    const q = { status: 'Active' };
    if (className) q.className = className;
    if (section) q.section = section;
    if (search) {
      const rx = new RegExp(search, 'i');
      q.$or = [
        { firstName: rx },
        { lastName: rx },
        { admissionNo: rx },
        { parentMobile: rx },
      ];
    }
    
    const students = await Student.find(q);
    
    const studentsWithPending = await Promise.all(
      students.map(async (student) => {
        // Count tuition fee payments for this student
        const paidCount = await FeePayment.countDocuments({
          student: student._id,
          feeType: 'Tuition',
        });
        
        // Calculate expected months (from academic year start or admission date)
        const now = new Date();
        const currentYear = now.getFullYear();
        const currentMonth = now.getMonth();
        
        // Academic year: April to March (India)
        let academicYearStart = new Date(currentYear, 3, 1); // April 1st
        if (currentMonth < 3) { // Before April = previous academic year
          academicYearStart.setFullYear(currentYear - 1);
        }
        
        const admissionDate = new Date(student.admissionDate || academicYearStart);
        const startDate = admissionDate > academicYearStart ? admissionDate : academicYearStart;
        
        // Total months from start to now
        const monthsDiff = Math.max(0,
          (now.getFullYear() - startDate.getFullYear()) * 12 +
          (now.getMonth() - startDate.getMonth()) + 1
        );
        
        const monthsPending = Math.max(0, monthsDiff - paidCount);
        const totalDue = monthsPending * (student.monthlyFee || 0);
        
        return {
          ...student.toObject(),
          monthsPending,
          totalDue,
          paidCount,
          expectedMonths: monthsDiff,
        };
      })
    );
    
    // Filter by minimum pending months if specified
    let filtered = studentsWithPending;
    if (minPending) {
      const min = parseInt(minPending);
      filtered = studentsWithPending.filter(s => s.monthsPending >= min);
    }
    
    // Sort: most pending first, then alphabetically by first name
    filtered.sort((a, b) => {
      if (b.monthsPending !== a.monthsPending) {
        return b.monthsPending - a.monthsPending;
      }
      return a.firstName.localeCompare(b.firstName);
    });
    
    res.json({ success: true, data: filtered });
  } catch (err) {
    next(err);
  }
};

// POST /api/students/:id/send-pending-sms
exports.sendPendingFeeSms = async (req, res, next) => {
  try {
    const student = await Student.findById(req.params.id);
    if (!student) {
      return res.status(404).json({ success: false, message: 'Student not found' });
    }
    
    const { monthsPending, totalDue } = req.body;
    
    const { sendFeePendingSMS } = require('../utils/smsService');
    const result = await sendFeePendingSMS({
      parentMobile: student.parentMobile,
      parentName: student.parentName,
      studentName: `${student.firstName} ${student.lastName}`.trim(),
      monthsPending,
      totalDue,
    });
    
    res.json({
      success: result.success,
      message: result.success ? 'SMS sent successfully' : 'SMS failed',
      error: result.error,
    });
  } catch (err) {
    next(err);
  }
};