import { useEffect, useState } from 'react';
import {
  Dialog, DialogTitle, DialogContent, DialogActions, Button, TextField,
  Grid, MenuItem, Alert
} from '@mui/material';
import api from '../../api/axios';

const empty = {
  admissionNo: '', firstName: '', lastName: '', gender: 'Male',
  className: '', section: 'A', rollNo: '',
  parentName: '', parentMobile: '', parentEmail: '',
  address: '', monthlyFee: 0, status: 'Active',
};

export default function StudentFormDialog({ open, onClose, student, onSaved }) {
  const [form, setForm] = useState(empty);
  const [err, setErr] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (student) setForm({ ...empty, ...student });
    else setForm(empty);
    setErr('');
  }, [student, open]);

  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  const submit = async () => {
    setSaving(true); setErr('');
    try {
      if (student?._id) await api.put(`/students/${student._id}`, form);
      else await api.post('/students', form);
      onSaved?.();
    } catch (e) {
      setErr(e.response?.data?.message || e.message);
    } finally { setSaving(false); }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle sx={{ bgcolor: '#1C2C56', color: '#fff' }}>
        {student?._id ? 'Edit Student' : 'Add Student'}
      </DialogTitle>
      <DialogContent dividers>
        {err && <Alert severity="error" sx={{ mb: 2 }}>{err}</Alert>}
        <Grid container spacing={2} sx={{ mt: 0.5 }}>
          <Grid item xs={12} sm={4}>
            <TextField fullWidth label="Admission No *" value={form.admissionNo} onChange={set('admissionNo')} />
          </Grid>
          <Grid item xs={12} sm={4}>
            <TextField fullWidth label="First Name *" value={form.firstName} onChange={set('firstName')} />
          </Grid>
          <Grid item xs={12} sm={4}>
            <TextField fullWidth label="Last Name" value={form.lastName} onChange={set('lastName')} />
          </Grid>
          <Grid item xs={12} sm={3}>
            <TextField select fullWidth label="Gender" value={form.gender} onChange={set('gender')}>
              {['Male', 'Female', 'Other'].map(g => <MenuItem key={g} value={g}>{g}</MenuItem>)}
            </TextField>
          </Grid>
          <Grid item xs={12} sm={3}>
            <TextField fullWidth label="Class *" value={form.className} onChange={set('className')} />
          </Grid>
          <Grid item xs={12} sm={3}>
            <TextField fullWidth label="Section" value={form.section} onChange={set('section')} />
          </Grid>
          <Grid item xs={12} sm={3}>
            <TextField fullWidth label="Roll No" value={form.rollNo} onChange={set('rollNo')} />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField fullWidth label="Parent Name *" value={form.parentName} onChange={set('parentName')} />
          </Grid>
          <Grid item xs={12} sm={3}>
            <TextField
              fullWidth label="Parent Mobile *"
              inputProps={{ maxLength: 10 }}
              value={form.parentMobile}
              onChange={(e) => setForm({ ...form, parentMobile: e.target.value.replace(/\D/g, '') })}
              helperText="10-digit Indian mobile"
            />
          </Grid>
          <Grid item xs={12} sm={3}>
            <TextField fullWidth type="number" label="Monthly Fee" value={form.monthlyFee} onChange={set('monthlyFee')} />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField fullWidth label="Parent Email" value={form.parentEmail} onChange={set('parentEmail')} />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField select fullWidth label="Status" value={form.status} onChange={set('status')}>
              {['Active', 'Inactive'].map(s => <MenuItem key={s} value={s}>{s}</MenuItem>)}
            </TextField>
          </Grid>
          <Grid item xs={12}>
            <TextField fullWidth multiline rows={2} label="Address" value={form.address} onChange={set('address')} />
          </Grid>
        </Grid>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button variant="contained" color="secondary" onClick={submit} disabled={saving}>
          {saving ? 'Saving...' : (student?._id ? 'Update' : 'Save')}
        </Button>
      </DialogActions>
    </Dialog>
  );
}