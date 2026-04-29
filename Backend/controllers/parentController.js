const Student = require('../models/Student');
const FeePayment = require('../models/FeePayment');
const Family = require('../models/Family');
const User = require('../models/User');

// POST /api/parents/login - Parent login with mobile number
exports.parentLogin = async (req, res, next) => {
  try {
    const { mobile, otp } = req.body;

    if (!mobile) {
      return res.status(400).json({
        success: false,
        message: 'Mobile number is required',
      });
    }

    // For now, we'll use a simple OTP (in production, send via SMS)
    // Simple OTP: last 4 digits of mobile number
    const expectedOTP = mobile.slice(-4);

    if (otp && otp !== expectedOTP) {
      return res.status(401).json({
        success: false,
        message: 'Invalid OTP',
      });
    }

    // Find students by parent mobile
    const students = await Student.find({ parentMobile: mobile })
      .populate('family')
      .select('admissionNo firstName lastName className section monthlyFee status photo parentName parentMobile family');

    if (students.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'No students found with this mobile number',
      });
    }

    // Create or get parent user
    let parentUser = await User.findOne({ username: mobile });

    if (!parentUser) {
      parentUser = await User.create({
        username: mobile,
        email: `${mobile}@parent.temp`,
        password: mobile, // Will be hashed automatically
        fullName: students[0].parentName,
        role: 'parent',
        permissions: {
          canViewStudents: false,
          canAddStudents: false,
          canEditStudents: false,
          canDeleteStudents: false,
          canViewFees: false,
          canCollectFees: false,
          canDeleteFees: false,
          canViewPendingFees: false,
          canSendFeeReminders: false,
          canViewFamilies: false,
          canManageFamilies: false,
          canManageUsers: false,
        },
      });
    }

    // Generate JWT token
    const jwt = require('jsonwebtoken');
    const token = jwt.sign({ id: parentUser._id }, process.env.JWT_SECRET, {
      expiresIn: process.env.JWT_EXPIRE || '30d',
    });

    res.json({
      success: true,
      token,
      data: {
        mobile,
        parentName: students[0].parentName,
        students: students.map(s => ({
          id: s._id,
          admissionNo: s.admissionNo,
          name: `${s.firstName} ${s.lastName}`,
          class: `${s.className}-${s.section}`,
          photo: s.photo?.url,
        })),
      },
    });
  } catch (err) {
    next(err);
  }
};

// POST /api/parents/request-otp - Request OTP
exports.requestOTP = async (req, res, next) => {
  try {
    const { mobile } = req.body;

    if (!mobile) {
      return res.status(400).json({
        success: false,
        message: 'Mobile number is required',
      });
    }

    // Check if mobile exists in students
    const studentExists = await Student.findOne({ parentMobile: mobile });

    if (!studentExists) {
      return res.status(404).json({
        success: false,
        message: 'Mobile number not registered',
      });
    }

    // In production, send SMS here
    // For demo: OTP is last 4 digits of mobile
    const otp = mobile.slice(-4);

    console.log(`OTP for ${mobile}: ${otp}`);

    res.json({
      success: true,
      message: 'OTP sent successfully',
      // In production, DON'T send OTP in response
      debug: { otp }, // Only for development
    });
  } catch (err) {
    next(err);
  }
};

// GET /api/parents/children - Get parent's children
exports.getChildren = async (req, res, next) => {
  try {
    const parentUser = await User.findById(req.user.id);
    const mobile = parentUser.username;

    const students = await Student.find({ parentMobile: mobile })
      .populate('family')
      .sort({ className: 1, section: 1 });

    res.json({
      success: true,
      data: students,
    });
  } catch (err) {
    next(err);
  }
};

// GET /api/parents/children/:id/fees - Get student's fee history
exports.getStudentFees = async (req, res, next) => {
  try {
    const parentUser = await User.findById(req.user.id);
    const mobile = parentUser.username;

    // Verify student belongs to this parent
    const student = await Student.findById(req.params.id);

    if (!student || student.parentMobile !== mobile) {
      return res.status(403).json({
        success: false,
        message: 'Unauthorized',
      });
    }

    const fees = await FeePayment.find({ student: req.params.id })
      .sort({ createdAt: -1 })
      .limit(50);

    res.json({
      success: true,
      data: fees,
    });
  } catch (err) {
    next(err);
  }
};

// GET /api/parents/children/:id/pending-fees - Get pending fees
exports.getPendingFees = async (req, res, next) => {
  try {
    const parentUser = await User.findById(req.user.id);
    const mobile = parentUser.username;

    // Verify student belongs to this parent
    const student = await Student.findById(req.params.id);

    if (!student || student.parentMobile !== mobile) {
      return res.status(403).json({
        success: false,
        message: 'Unauthorized',
      });
    }

    // Calculate pending fees
    const admissionDate = new Date(student.admissionDate);
    const today = new Date();

    const allMonths = [];
    let current = new Date(admissionDate.getFullYear(), admissionDate.getMonth(), 1);

    while (current <= today) {
      const monthStr = current.toLocaleString('en-US', { month: 'long', year: 'numeric' });
      allMonths.push(monthStr);
      current.setMonth(current.getMonth() + 1);
    }

    // Get paid months
    const paidFees = await FeePayment.find({
      student: req.params.id,
      feeType: 'Tuition',
    });

    const paidMonths = paidFees.map(f => f.month);
    const unpaidMonths = allMonths.filter(m => !paidMonths.includes(m));

    const totalDue = unpaidMonths.length * student.monthlyFee;

    res.json({
      success: true,
      data: {
        student: {
          id: student._id,
          name: `${student.firstName} ${student.lastName}`,
          class: `${student.className}-${student.section}`,
          monthlyFee: student.monthlyFee,
        },
        unpaidMonths,
        monthsPending: unpaidMonths.length,
        totalDue,
      },
    });
  } catch (err) {
    next(err);
  }
};