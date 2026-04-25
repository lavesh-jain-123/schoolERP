import { useEffect, useState } from 'react';
import {
  Dialog, DialogTitle, DialogContent, DialogActions, Button, TextField,
  Grid, MenuItem, Alert, Typography, Box, FormControlLabel, Checkbox, IconButton,
  Select, Chip, OutlinedInput, Autocomplete
} from '@mui/material';
import { QrCodeScanner, Close, Group } from '@mui/icons-material';
import api from '../../api/axios';
import { useToast } from '../../context/ToastContext';

const feeTypes = ['Tuition', 'Transport', 'Exam', 'Admission', 'Library', 'Other'];
const modes = ['Cash', 'UPI', 'Card', 'Cheque', 'Bank Transfer'];

export default function CollectFeeDialog({ open, onClose, student, onSaved }) {
  const [form, setForm] = useState({
    amount: '', feeType: 'Tuition', months: [], academicYear: '2025-26',
    paymentMode: 'Cash', transactionId: '', remarks: '', sendSms: true,
  });
  const [err, setErr] = useState('');
  const [result, setResult] = useState(null);
  const [saving, setSaving] = useState(false);
  const [qrOpen, setQrOpen] = useState(false);
  const [unpaidMonths, setUnpaidMonths] = useState([]);
  const [loading, setLoading] = useState(false);
  const [siblings, setSiblings] = useState([]);
  const [selectedSiblings, setSelectedSiblings] = useState([]);
  const { showSuccess, showError } = useToast();

  useEffect(() => {
    if (open && student) {
      loadUnpaidMonths();
      loadSiblings();
      setForm({
        amount: student.monthlyFee || '',
        feeType: 'Tuition',
        months: [],
        academicYear: '2025-26',
        paymentMode: 'Cash',
        transactionId: '',
        remarks: '',
        sendSms: true,
      });
      setSelectedSiblings([student._id]); // Pre-select current student
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

  const toggleSibling = (siblingId) => {
    setSelectedSiblings(prev => 
      prev.includes(siblingId)
        ? prev.filter(id => id !== siblingId)
        : [...prev, siblingId]
    );
  };

  const submit = async () => {
    if (form.months.length === 0) {
      setErr('Please select at least one month');
      return;
    }

    setSaving(true);
    setErr('');
    try {
      const payload = {
        ...form,
        months: form.months,
      };

      // If multiple students selected, use studentIds, otherwise studentId
      if (selectedSiblings.length > 1) {
        payload.studentIds = selectedSiblings;
      } else {
        payload.studentId = student._id;
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

  const totalAmount = (form.amount || 0) * (form.months?.length || 0) * selectedSiblings.length;

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
                    onClick={() => toggleSibling(sib._id)}
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
              <Grid item xs={12}>
                <Typography variant="caption" color="text.secondary" sx={{ mb: 0.5, display: 'block' }}>
                  Select Month(s) *
                </Typography>
                <Select
                  multiple
                  fullWidth
                  value={form.months}
                  onChange={handleMonthChange}
                  input={<OutlinedInput />}
                  disabled={loading}
                  renderValue={(selected) => (
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                      {selected.map((value) => (
                        <Chip key={value} label={value} size="small" color="primary" />
                      ))}
                    </Box>
                  )}
                  sx={{ minHeight: 56 }}
                >
                  {loading ? (
                    <MenuItem disabled>Loading unpaid months...</MenuItem>
                  ) : unpaidMonths.length === 0 ? (
                    <MenuItem disabled>No unpaid months</MenuItem>
                  ) : (
                    unpaidMonths.map((month) => (
                      <MenuItem key={month} value={month}>
                        {month}
                      </MenuItem>
                    ))
                  )}
                </Select>
                {unpaidMonths.length > 0 && (
                  <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, display: 'block' }}>
                    {unpaidMonths.length} unpaid month(s) available for {student.firstName}
                  </Typography>
                )}
              </Grid>

              <Grid item xs={6}>
                <TextField 
                  fullWidth 
                  type="number" 
                  label="Amount per Month *" 
                  value={form.amount} 
                  onChange={set('amount')} 
                />
              </Grid>
              <Grid item xs={6}>
                <TextField select fullWidth label="Fee Type" value={form.feeType} onChange={set('feeType')}>
                  {feeTypes.map(t => <MenuItem key={t} value={t}>{t}</MenuItem>)}
                </TextField>
              </Grid>

              {form.months.length > 0 && form.amount > 0 && (
                <Grid item xs={12}>
                  <Alert severity="info" sx={{ py: 1 }}>
                    <Typography variant="body2">
                      <b>Total Amount:</b> ₹{totalAmount.toLocaleString()} 
                      <Typography component="span" variant="caption" sx={{ ml: 1 }}>
                        ({selectedSiblings.length} student(s) × {form.months.length} month(s) × ₹{form.amount})
                      </Typography>
                    </Typography>
                  </Alert>
                </Grid>
              )}

              <Grid item xs={6}>
                <TextField fullWidth label="Academic Year" value={form.academicYear} onChange={set('academicYear')} />
              </Grid>
              <Grid item xs={6}>
                <TextField select fullWidth label="Payment Mode" value={form.paymentMode} onChange={set('paymentMode')}>
                  {modes.map(m => <MenuItem key={m} value={m}>{m}</MenuItem>)}
                </TextField>
              </Grid>
              <Grid item xs={12}>
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
              disabled={saving || !form.amount || form.months.length === 0}
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