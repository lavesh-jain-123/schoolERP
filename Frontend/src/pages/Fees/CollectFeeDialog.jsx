import { useEffect, useState } from 'react';
import {
  Dialog, DialogTitle, DialogContent, DialogActions, Button, TextField,
  Grid, MenuItem, Alert, Typography, Box, FormControlLabel, Checkbox, IconButton,
  Select, Chip, OutlinedInput, Autocomplete, Paper, Divider, Stack
} from '@mui/material';
import { QrCodeScanner, Close, Group, Person, CalendarMonth } from '@mui/icons-material';
import api from '../../api/axios';
import { useToast } from '../../context/ToastContext';

const feeTypes = ['Tuition', 'Transport', 'Exam', 'Admission', 'Library', 'Other'];
const modes = ['Cash', 'UPI', 'Card', 'Cheque', 'Bank Transfer'];

// Generate month list (current month + 12 future months)
const generateMonthOptions = () => {
  const months = [];
  const monthNames = ['April', 'May', 'June', 'July', 'August', 'September', 
                      'October', 'November', 'December', 'January', 'February', 'March'];
  
  const now = new Date();
  const currentMonth = now.getMonth(); // 0-11
  const currentYear = now.getFullYear();
  
  // Start from April of academic year
  let startMonth = 3; // April (0-indexed)
  let startYear = currentMonth >= 3 ? currentYear : currentYear - 1; // Academic year logic
  
  // Generate 24 months (2 academic years)
  for (let i = 0; i < 24; i++) {
    const monthIndex = (startMonth + i) % 12;
    const year = startYear + Math.floor((startMonth + i) / 12);
    const monthName = monthNames[monthIndex];
    months.push(`${monthName}-${year}`);
  }
  
  return months;
};

export default function CollectFeeDialog({ open, onClose, student, onSaved }) {
  const [form, setForm] = useState({
    feeType: 'Tuition', 
    months: [], 
    academicYear: '2025-26',
    paymentMode: 'Cash', 
    transactionId: '', 
    remarks: '', 
    sendSms: true,
  });
  const [studentFees, setStudentFees] = useState({}); // { studentId: amount }
  const [err, setErr] = useState('');
  const [result, setResult] = useState(null);
  const [saving, setSaving] = useState(false);
  const [qrOpen, setQrOpen] = useState(false);
  const [unpaidMonths, setUnpaidMonths] = useState([]);
  const [loading, setLoading] = useState(false);
  const [siblings, setSiblings] = useState([]);
  const [selectedSiblings, setSelectedSiblings] = useState([]);
  const [allMonthOptions, setAllMonthOptions] = useState([]);
  const { showSuccess, showError } = useToast();

  useEffect(() => {
    if (open && student) {
      loadUnpaidMonths();
      loadSiblings();
      
      // Initialize form
      setForm({
        feeType: 'Tuition',
        months: [],
        academicYear: '2025-26',
        paymentMode: 'Cash',
        transactionId: '',
        remarks: '',
        sendSms: true,
      });
      
      // Initialize student fees - auto-fetch but editable
      setStudentFees({ [student._id]: student.monthlyFee || 0 });
      
      // Pre-select current student
      setSelectedSiblings([student._id]);
      
      // Generate month options
      setAllMonthOptions(generateMonthOptions());
      
      setErr('');
      setResult(null);
      setQrOpen(false);
    }
    // eslint-disable-next-line
  }, [open, student]);

  const loadSiblings = async () => {
    if (!student?._id || !student?.family) {
      console.log('No family found:', { studentId: student?._id, family: student?.family });
      return;
    }
    
    try {
      // Extract family ID - handle both populated object and ID string
      const familyId = typeof student.family === 'object' ? student.family._id : student.family;
      
      console.log('Loading family:', familyId);
      
      // If family is already populated with students, use it directly
      if (typeof student.family === 'object' && student.family.students) {
        console.log('Family already populated:', student.family);
        const allSiblings = student.family.students || [];
        const filtered = allSiblings.filter(s => s._id !== student._id && s.status === 'Active');
        console.log('Filtered siblings:', filtered);
        setSiblings(filtered);
        return;
      }
      
      // Otherwise fetch the family
      const { data } = await api.get(`/families/${familyId}`);
      console.log('Family data:', data.data);
      const allSiblings = data.data.students || [];
      console.log('All siblings:', allSiblings);
      const filtered = allSiblings.filter(s => s._id !== student._id && s.status === 'Active');
      console.log('Filtered siblings:', filtered);
      setSiblings(filtered);
    } catch (e) {
      console.error('Failed to load siblings:', e);
      setSiblings([]);
    }
  };

  const loadUnpaidMonths = async () => {
    if (!student?._id) return;
    setLoading(true);
    try {
      const { data } = await api.get(`/fees/unpaid-months/${student._id}`);
      setUnpaidMonths(data.data || []);
    } catch (e) {
      console.error('Failed to load unpaid months:', e);
      setUnpaidMonths([]);
    } finally {
      setLoading(false);
    }
  };

  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  const handleMonthChange = (event) => {
    const value = event.target.value;
    setForm({ ...form, months: typeof value === 'string' ? value.split(',') : value });
  };

  const toggleSibling = (siblingId, siblingData) => {
    if (selectedSiblings.includes(siblingId)) {
      // Remove sibling
      setSelectedSiblings(prev => prev.filter(id => id !== siblingId));
      setStudentFees(prev => {
        const newFees = { ...prev };
        delete newFees[siblingId];
        return newFees;
      });
    } else {
      // Add sibling
      setSelectedSiblings(prev => [...prev, siblingId]);
      // Auto-populate their monthly fee
      setStudentFees(prev => ({
        ...prev,
        [siblingId]: siblingData.monthlyFee || 0
      }));
    }
  };

  const updateStudentFee = (studentId, amount) => {
    setStudentFees(prev => ({
      ...prev,
      [studentId]: parseFloat(amount) || 0
    }));
  };

  const submit = async () => {
    if (form.months.length === 0) {
      setErr('Please select at least one month');
      return;
    }

    // Validate that all selected students have fees
    const missingFees = selectedSiblings.filter(id => !studentFees[id] || studentFees[id] <= 0);
    if (missingFees.length > 0) {
      setErr('Please enter valid fee amount for all selected students');
      return;
    }

    setSaving(true);
    setErr('');
    try {
      const payload = {
        ...form,
        months: form.months,
      };

      // If multiple students selected, use studentIds with individual amounts
      if (selectedSiblings.length > 1) {
        payload.studentIds = selectedSiblings;
        payload.studentFees = studentFees; // Send individual fees
      } else {
        payload.studentId = student._id;
        payload.amount = studentFees[student._id];
      }

      const { data } = await api.post('/fees', payload);
      setResult(data.data);
      
      const studentCount = data.data.studentsCovered?.length || 1;
      showSuccess(
        studentCount > 1
          ? `Fee collected for ${studentCount} students. Total: ₹${data.data.totalAmount}`
          : `Fee collected successfully. Receipt: ${data.data.receiptNo}`
      );
      
      onSaved?.(data.data);
      loadUnpaidMonths();
    } catch (e) {
      setErr(e.response?.data?.message || e.message);
    } finally {
      setSaving(false);
    }
  };

  if (!student) return null;

  // Calculate total amount
  const totalAmount = selectedSiblings.reduce((sum, studentId) => {
    const fee = studentFees[studentId] || 0;
    return sum + (fee * (form.months?.length || 0));
  }, 0);

  // Get student object by ID
  const getStudentById = (id) => {
    if (id === student._id) return student;
    return siblings.find(s => s._id === id);
  };

  return (
    <>
      <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
        <DialogTitle sx={{ bgcolor: '#1C2C56', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span>Collect Fee — {student.firstName} {student.lastName}</span>
          <Box>
            {siblings.length > 0 && (
              <Chip
                icon={<Group />}
                label={`${siblings.length} sibling${siblings.length > 1 ? 's' : ''}`}
                size="small"
                sx={{ bgcolor: '#8fc750', color: '#1C2C56', mr: 1, fontWeight: 600 }}
              />
            )}
            <IconButton
              onClick={() => setQrOpen(true)}
              sx={{ color: '#8fc750' }}
              title="Show Payment QR Code"
            >
              <QrCodeScanner />
            </IconButton>
          </Box>
        </DialogTitle>

        <DialogContent dividers>
          <Box sx={{ mb: 2, p: 1.5, bgcolor: '#f5f6fa', borderRadius: 1 }}>
            <Typography variant="body2">
              <b>Adm No:</b> {student.admissionNo} &nbsp;|&nbsp;
              <b>Class:</b> {student.className}-{student.section} &nbsp;|&nbsp;
              <b>Parent:</b> {student.parentName} ({student.parentMobile})
              {student.family && siblings.length > 0 && (
                <>
                  <br />
                  <b>Family ID:</b> {student.family.familyId || student.family}
                </>
              )}
            </Typography>
          </Box>

          {err && <Alert severity="error" sx={{ mb: 2 }}>{err}</Alert>}

          {/* Sibling Selection */}
          {siblings.length > 0 && !result && (
            <Box sx={{ mb: 2, p: 2, border: '1px solid #e0e0e0', borderRadius: 1 }}>
              <Typography variant="subtitle2" fontWeight={600} gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Group /> Pay for Siblings Together
              </Typography>
              <Typography variant="caption" color="text.secondary" display="block" sx={{ mb: 1 }}>
                Select multiple students to collect combined fee payment
              </Typography>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                <Chip
                  label={`${student.firstName} ${student.lastName} (Current)`}
                  color="primary"
                  size="small"
                  sx={{ fontWeight: 600 }}
                />
                {siblings.map(sib => (
                  <Chip
                    key={sib._id}
                    label={`${sib.firstName} ${sib.lastName} - ${sib.className}${sib.section}`}
                    onClick={() => toggleSibling(sib._id, sib)}
                    color={selectedSiblings.includes(sib._id) ? 'secondary' : 'default'}
                    variant={selectedSiblings.includes(sib._id) ? 'filled' : 'outlined'}
                    size="small"
                  />
                ))}
              </Box>
              {selectedSiblings.length > 1 && (
                <Alert severity="info" sx={{ mt: 1 }}>
                  <Typography variant="caption">
                    Fee will be collected for <b>{selectedSiblings.length} students</b>. 
                    One SMS will be sent to parent with combined summary.
                  </Typography>
                </Alert>
              )}
            </Box>
          )}

          {result ? (
            <Alert severity={result.smsStatus === 'Sent' ? 'success' : 'warning'}>
              <Typography variant="body2" fontWeight={600}>
                {result.totalPayments} receipt(s) created for {result.totalStudents} student(s)
              </Typography>
              {result.studentsCovered && (
                <Typography variant="body2" sx={{ mt: 0.5 }}>
                  Students: <b>{result.studentsCovered.map(s => s.name).join(', ')}</b>
                </Typography>
              )}
              <Typography variant="body2">
                Total Amount: <b>₹{result.totalAmount?.toLocaleString()}</b>
              </Typography>
              <Typography variant="body2">
                Receipts: <b>{result.allReceipts?.join(', ')}</b>
              </Typography>
              <Typography variant="body2">
                Months: <b>{result.monthsCovered?.join(', ')}</b>
              </Typography>
              <Typography variant="body2">
                SMS status: <b>{result.smsStatus}</b>
                {result.smsError ? ` — ${result.smsError}` : ''}
              </Typography>
              <Typography variant="caption" sx={{ mt: 1, display: 'block' }}>
                Go to <b>Fee Payments</b> page to print receipts.
              </Typography>
            </Alert>
          ) : (
            <Grid container spacing={2}>
              {/* Student-wise Fee Inputs */}
              <Grid item xs={12}>
                <Paper sx={{ p: 2, bgcolor: '#f8f9fa', border: '1px solid #e0e0e0' }}>
                  <Typography variant="subtitle2" fontWeight={600} gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Person /> Student-wise Fee Amount (Editable)
                  </Typography>
                  <Divider sx={{ mb: 2 }} />
                  <Grid container spacing={2}>
                    {selectedSiblings.map(studentId => {
                      const studentData = getStudentById(studentId);
                      return (
                        <Grid item xs={12} sm={6} key={studentId}>
                          <TextField
                            fullWidth
                            type="number"
                            label={`${studentData?.firstName} ${studentData?.lastName} - Fee per Month`}
                            value={studentFees[studentId] || ''}
                            onChange={(e) => updateStudentFee(studentId, e.target.value)}
                            InputProps={{
                              startAdornment: <Typography sx={{ mr: 1 }}>₹</Typography>,
                            }}
                            helperText={
                              <Typography variant="caption" color="text.secondary">
                                {studentData?.className}-{studentData?.section} | Default: ₹{studentData?.monthlyFee || 0}
                              </Typography>
                            }
                          />
                        </Grid>
                      );
                    })}
                  </Grid>
                </Paper>
              </Grid>

              {/* Month Selection - All months including future */}
              <Grid item xs={12}>
                <Typography variant="caption" color="text.secondary" sx={{ mb: 0.5, display: 'flex', alignItems: 'center', gap: 0.5 }}>
                  <CalendarMonth fontSize="small" /> Select Month(s) * 
                  <Chip label="Past + Current + Future" size="small" sx={{ ml: 1, height: 20 }} />
                </Typography>
                <Select
                  multiple
                  fullWidth
                  value={form.months}
                  onChange={handleMonthChange}
                  input={<OutlinedInput />}
                  renderValue={(selected) => (
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                      {selected.map((value) => {
                        const isPaid = !unpaidMonths.includes(value);
                        return (
                          <Chip 
                            key={value} 
                            label={value} 
                            size="small" 
                            color={isPaid ? "default" : "primary"}
                            sx={{ fontWeight: isPaid ? 400 : 600 }}
                          />
                        );
                      })}
                    </Box>
                  )}
                  sx={{ minHeight: 56 }}
                >
                  {allMonthOptions.map((month) => {
                    const isUnpaid = unpaidMonths.includes(month);
                    const isFuture = !isUnpaid && !loading;
                    return (
                      <MenuItem key={month} value={month}>
                        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
                          <span>{month}</span>
                          {isUnpaid && (
                            <Chip label="Unpaid" size="small" color="error" sx={{ ml: 1, height: 20 }} />
                          )}
                          {isFuture && (
                            <Chip label="Future" size="small" color="success" sx={{ ml: 1, height: 20 }} />
                          )}
                        </Box>
                      </MenuItem>
                    );
                  })}
                </Select>
                <Stack direction="row" spacing={1} sx={{ mt: 0.5 }}>
                  {unpaidMonths.length > 0 && (
                    <Typography variant="caption" color="error">
                      {unpaidMonths.length} unpaid month(s)
                    </Typography>
                  )}
                  <Typography variant="caption" color="text.secondary">
                    | You can select any past, current, or future months
                  </Typography>
                </Stack>
              </Grid>

              {/* Fee Summary */}
              {form.months.length > 0 && selectedSiblings.length > 0 && (
                <Grid item xs={12}>
                  <Alert severity="info" sx={{ py: 1 }}>
                    <Typography variant="body2" fontWeight={600} gutterBottom>
                      Fee Calculation Breakdown:
                    </Typography>
                    {selectedSiblings.map(studentId => {
                      const studentData = getStudentById(studentId);
                      const fee = studentFees[studentId] || 0;
                      const studentTotal = fee * form.months.length;
                      return (
                        <Typography key={studentId} variant="caption" display="block">
                          • {studentData?.firstName} {studentData?.lastName}: 
                          ₹{fee} × {form.months.length} months = <b>₹{studentTotal.toLocaleString()}</b>
                        </Typography>
                      );
                    })}
                    <Divider sx={{ my: 1 }} />
                    <Typography variant="body2" fontWeight={700}>
                      <b>Grand Total:</b> ₹{totalAmount.toLocaleString()}
                    </Typography>
                  </Alert>
                </Grid>
              )}

              <Grid item xs={6}>
                <TextField fullWidth label="Academic Year" value={form.academicYear} onChange={set('academicYear')} />
              </Grid>
              <Grid item xs={6}>
                <TextField select fullWidth label="Fee Type" value={form.feeType} onChange={set('feeType')}>
                  {feeTypes.map(t => <MenuItem key={t} value={t}>{t}</MenuItem>)}
                </TextField>
              </Grid>
              <Grid item xs={6}>
                <TextField select fullWidth label="Payment Mode" value={form.paymentMode} onChange={set('paymentMode')}>
                  {modes.map(m => <MenuItem key={m} value={m}>{m}</MenuItem>)}
                </TextField>
              </Grid>
              <Grid item xs={6}>
                <TextField fullWidth label="Txn / Cheque No" value={form.transactionId} onChange={set('transactionId')} />
              </Grid>
              <Grid item xs={12}>
                <TextField fullWidth multiline rows={2} label="Remarks" value={form.remarks} onChange={set('remarks')} />
              </Grid>
              <Grid item xs={12}>
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={form.sendSms}
                      onChange={(e) => setForm({ ...form, sendSms: e.target.checked })}
                    />
                  }
                  label={`Send SMS to parent (${student.parentMobile})`}
                />
              </Grid>
            </Grid>
          )}
        </DialogContent>

        <DialogActions>
          <Button onClick={onClose}>{result ? 'Close' : 'Cancel'}</Button>
          {!result && (
            <Button 
              variant="contained" 
              color="secondary" 
              onClick={submit} 
              disabled={saving || selectedSiblings.length === 0 || form.months.length === 0 || totalAmount <= 0}
            >
              {saving ? 'Saving...' : `Collect Fee (₹${totalAmount.toLocaleString()})`}
            </Button>
          )}
        </DialogActions>
      </Dialog>

      {/* QR Code Overlay */}
      <Dialog
        open={qrOpen}
        onClose={() => setQrOpen(false)}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: {
            bgcolor: 'rgba(0, 0, 0, 0.9)',
            boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
          }
        }}
      >
        <DialogTitle sx={{ bgcolor: '#1C2C56', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'space-between', py: 1.5 }}>
          <Typography variant="h6">Scan to Pay</Typography>
          <IconButton onClick={() => setQrOpen(false)} sx={{ color: '#fff' }}>
            <Close />
          </IconButton>
        </DialogTitle>
        <DialogContent sx={{ p: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 400 }}>
          <Box
            component="img"
            src="/payment.jpeg"
            alt="Payment QR Code"
            sx={{
              width: '100%',
              height: 'auto',
              maxHeight: '70vh',
              objectFit: 'contain',
            }}
          />
        </DialogContent>
        <DialogActions sx={{ bgcolor: '#1C2C56', py: 1 }}>
          <Button onClick={() => setQrOpen(false)} sx={{ color: '#8fc750' }}>
            Close
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}