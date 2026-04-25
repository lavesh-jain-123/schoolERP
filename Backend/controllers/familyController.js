const Family = require('../models/Family');
const Student = require('../models/Student');

// GET /api/families
exports.getFamilies = async (req, res, next) => {
  try {
    const { search } = req.query;
    const q = {};
    if (search) {
      const rx = new RegExp(search, 'i');
      q.$or = [
        { familyId: rx },
        { parentName: rx },
        { parentMobile: rx },
      ];
    }
    
    const families = await Family.find(q)
      .populate('students', 'admissionNo firstName lastName className section status')
      .sort({ createdAt: -1 });
    
    res.json({ success: true, data: families });
  } catch (err) {
    next(err);
  }
};

// GET /api/families/:id
exports.getFamily = async (req, res, next) => {
  try {
    const family = await Family.findById(req.params.id)
      .populate('students', 'admissionNo firstName lastName className section monthlyFee status');
    
    if (!family) {
      return res.status(404).json({ success: false, message: 'Family not found' });
    }
    
    res.json({ success: true, data: family });
  } catch (err) {
    next(err);
  }
};

// POST /api/families
exports.createFamily = async (req, res, next) => {
  try {
    const family = await Family.create(req.body);
    res.status(201).json({ success: true, data: family });
  } catch (err) {
    if (err.code === 11000) {
      return res.status(400).json({
        success: false,
        message: 'Family ID already exists',
      });
    }
    next(err);
  }
};

// PUT /api/families/:id
exports.updateFamily = async (req, res, next) => {
  try {
    const family = await Family.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    ).populate('students');
    
    if (!family) {
      return res.status(404).json({ success: false, message: 'Family not found' });
    }
    
    res.json({ success: true, data: family });
  } catch (err) {
    next(err);
  }
};

// DELETE /api/families/:id
exports.deleteFamily = async (req, res, next) => {
  try {
    const family = await Family.findById(req.params.id);
    
    if (!family) {
      return res.status(404).json({ success: false, message: 'Family not found' });
    }
    
    // Remove family reference from all students
    await Student.updateMany(
      { family: family._id },
      { $unset: { family: 1 } }
    );
    
    await family.deleteOne();
    
    res.json({ success: true, message: 'Family deleted' });
  } catch (err) {
    next(err);
  }
};

// POST /api/families/:id/add-student - Link student to family
exports.addStudentToFamily = async (req, res, next) => {
  try {
    const { studentId } = req.body;
    const family = await Family.findById(req.params.id);
    
    if (!family) {
      return res.status(404).json({ success: false, message: 'Family not found' });
    }
    
    const student = await Student.findById(studentId);
    
    if (!student) {
      return res.status(404).json({ success: false, message: 'Student not found' });
    }
    
    // Add student to family
    if (!family.students.includes(studentId)) {
      family.students.push(studentId);
      await family.save();
    }
    
    // Update student with family reference
    student.family = family._id;
    await student.save();
    
    const updated = await Family.findById(family._id).populate('students');
    
    res.json({ success: true, data: updated });
  } catch (err) {
    next(err);
  }
};

// POST /api/families/:id/remove-student - Unlink student from family
exports.removeStudentFromFamily = async (req, res, next) => {
  try {
    const { studentId } = req.body;
    const family = await Family.findById(req.params.id);
    
    if (!family) {
      return res.status(404).json({ success: false, message: 'Family not found' });
    }
    
    // Remove from family
    family.students = family.students.filter(s => s.toString() !== studentId);
    await family.save();
    
    // Remove family reference from student
    await Student.findByIdAndUpdate(studentId, { $unset: { family: 1 } });
    
    const updated = await Family.findById(family._id).populate('students');
    
    res.json({ success: true, data: updated });
  } catch (err) {
    next(err);
  }
};