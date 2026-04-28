import { useEffect, useState } from 'react';
import {
  Dialog, DialogTitle, DialogContent, DialogActions, Button, TextField,
  Grid, MenuItem, Alert, Autocomplete, Typography, Box, Avatar, IconButton,
  LinearProgress
} from '@mui/material';
import { PhotoCamera, Delete } from '@mui/icons-material';
import api from '../../api/axios';
import { useToast } from '../../context/ToastContext';


const empty = {
  admissionNo: '',
  firstName: '',
  lastName: '',
  dob: '',
  gender: '',
  className: '',
  section: 'A',
  rollNo: '',
  parentName: '',
  parentMobile: '',
  parentEmail: '',
  address: '',
  monthlyFee: '',
  status: 'Active',
  family: null,
  photo: { url: '', publicId: '' },
};

export default function StudentFormDialog({ open, onClose, student, onSaved }) {
  const [form, setForm] = useState(empty);
  const [err, setErr] = useState('');
  const [saving, setSaving] = useState(false);
  const [families, setFamilies] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const { showSuccess, showError } = useToast();

  useEffect(() => {
    loadFamilies();
    if (student) {
      setForm({
        ...empty,
        ...student,
        dob: student.dob ? student.dob.split('T')[0] : '',
        family: student.family?._id || student.family || null,
        photo: student.photo || { url: '', publicId: '' },
      });
    } else {
      setForm(empty);
    }
    setErr('');
  }, [student, open]);

  const loadFamilies = async () => {
    try {
      const { data } = await api.get('/families');
      setFamilies(data.data);
    } catch (e) {
      console.error('Failed to load families:', e);
    }
  };

   const handlePrintIDCard = async (student) => {
    try {
      // Load full student data if needed
      const { data } = await api.get(`/students/${student._id}`);
      printIDCard(data.data);
    } catch (err) {
      showError('Failed to load student details');
      console.error('Failed to load student:', err);
    }
  };

  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

 const handlePhotoUpload = async (e) => {
  const file = e.target.files[0];
  if (!file) return;

  console.log('Selected file:', {
    name: file.name,
    size: file.size,
    type: file.type
  });

  // Validate file size (5MB)
  if (file.size > 5 * 1024 * 1024) {
    showError('Photo size must be less than 5MB');
    return;
  }

  // Validate file type
  if (!file.type.startsWith('image/')) {
    showError('Only image files are allowed');
    return;
  }

  setUploading(true);
  setUploadProgress(0);

  try {
    const formData = new FormData();
    formData.append('photo', file);

    console.log('Sending request to:', '/upload/student-photo');
    console.log('FormData entries:', Array.from(formData.entries()));

    const { data } = await api.post('/upload/student-photo', formData, {
      headers: { 
        'Content-Type': 'multipart/form-data' 
      },
      onUploadProgress: (progressEvent) => {
        const percent = Math.round((progressEvent.loaded * 100) / progressEvent.total);
        setUploadProgress(percent);
        console.log('Upload progress:', percent + '%');
      },
    });

    console.log('Upload SUCCESS:', data);

    setForm({
      ...form,
      photo: {
        url: data.data.url,
        publicId: data.data.publicId,
      },
    });
    showSuccess('Photo uploaded successfully');
  } catch (e) {
    console.error('Upload FAILED - Full error:', e);
    console.error('Error response:', e.response);
    console.error('Error data:', e.response?.data);
    console.error('Error message:', e.message);
    
    const errorMsg = e.response?.data?.message || e.response?.data?.error || e.message || 'Photo upload failed';
    showError(errorMsg);
  } finally {
    setUploading(false);
    setUploadProgress(0);
  }
};

  const handlePhotoDelete = async () => {
    if (!form.photo?.publicId) {
      setForm({ ...form, photo: { url: '', publicId: '' } });
      return;
    }

    try {
      await api.delete('/upload/student-photo', {
        data: { publicId: form.photo.publicId },
      });
      setForm({ ...form, photo: { url: '', publicId: '' } });
      showSuccess('Photo deleted');
    } catch (e) {
      showError('Failed to delete photo');
    }
  };

  const submit = async () => {
    setSaving(true);
    setErr('');
    try {
      if (student?._id) {
        await api.put(`/students/${student._id}`, form);
      } else {
        await api.post('/students', form);
      }
      onSaved?.();
    } catch (e) {
      setErr(e.response?.data?.message || e.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle sx={{ bgcolor: '#1C2C56', color: '#fff' }}>
        {student?._id ? 'Edit Student' : 'Add Student'}
      </DialogTitle>
      <DialogContent dividers>
        {err && <Alert severity="error" sx={{ mb: 2 }}>{err}</Alert>}

        {/* Photo Upload Section */}
        <Box sx={{ mb: 3, textAlign: 'center' }}>
          <Typography variant="subtitle2" gutterBottom>
            Student Photo
          </Typography>
          <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 2 }}>
            <Avatar
              src={form.photo?.url}
              sx={{ width: 120, height: 120, border: '3px solid #1C2C56' }}
            >
              {form.firstName?.[0]}{form.lastName?.[0]}
            </Avatar>
            <Box>
              <Button
                variant="contained"
                component="label"
                startIcon={<PhotoCamera />}
                disabled={uploading}
                size="small"
              >
                {form.photo?.url ? 'Change Photo' : 'Upload Photo'}
                <input
                  type="file"
                  hidden
                  accept="image/*"
                  onChange={handlePhotoUpload}
                />
              </Button>
              {form.photo?.url && (
                <IconButton
                  color="error"
                  onClick={handlePhotoDelete}
                  disabled={uploading}
                  size="small"
                  sx={{ ml: 1 }}
                >
                  <Delete />
                </IconButton>
              )}
              {uploading && (
                <Box sx={{ mt: 1, width: 200 }}>
                  <LinearProgress variant="determinate" value={uploadProgress} />
                  <Typography variant="caption">{uploadProgress}%</Typography>
                </Box>
              )}
            </Box>
          </Box>
        </Box>

        <Grid container spacing={2}>
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="Admission No *"
              value={form.admissionNo}
              onChange={set('admissionNo')}
              disabled={!!student?._id}
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="First Name *"
              value={form.firstName}
              onChange={set('firstName')}
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField fullWidth label="Last Name" value={form.lastName} onChange={set('lastName')} />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="Date of Birth"
              type="date"
              value={form.dob}
              onChange={set('dob')}
              InputLabelProps={{ shrink: true }}
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField select fullWidth label="Gender" value={form.gender} onChange={set('gender')}>
              <MenuItem value="">Select</MenuItem>
              <MenuItem value="Male">Male</MenuItem>
              <MenuItem value="Female">Female</MenuItem>
              <MenuItem value="Other">Other</MenuItem>
            </TextField>
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField fullWidth label="Class *" value={form.className} onChange={set('className')} />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField fullWidth label="Section" value={form.section} onChange={set('section')} />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField fullWidth label="Roll No" value={form.rollNo} onChange={set('rollNo')} />
          </Grid>
          <Grid item xs={12}>
            <Autocomplete
              options={families}
              getOptionLabel={(f) => `${f.familyId} - ${f.parentName} (${f.parentMobile})`}
              value={families.find(f => f._id === form.family) || null}
              onChange={(e, val) => setForm({ ...form, family: val?._id || null })}
              renderInput={(params) => (
                <TextField {...params} label="Link to Family (Optional)" />
              )}
            />
            <Typography variant="caption" color="text.secondary">
              Link this student to a family group for sibling fee payments
            </Typography>
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField fullWidth label="Parent Name" value={form.parentName} onChange={set('parentName')} />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="Parent Mobile"
              value={form.parentMobile}
              onChange={set('parentMobile')}
              inputProps={{ maxLength: 10 }}
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="Parent Email"
              type="email"
              value={form.parentEmail}
              onChange={set('parentEmail')}
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="Monthly Fee"
              type="number"
              value={form.monthlyFee}
              onChange={set('monthlyFee')}
            />
          </Grid>
          <Grid item xs={12}>
            <TextField
              fullWidth
              label="Address"
              multiline
              rows={2}
              value={form.address}
              onChange={set('address')}
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField select fullWidth label="Status" value={form.status} onChange={set('status')}>
              <MenuItem value="Active">Active</MenuItem>
              <MenuItem value="Inactive">Inactive</MenuItem>
            </TextField>
          </Grid>
        </Grid>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button variant="contained" color="secondary" onClick={submit} disabled={saving || uploading}>
          {saving ? 'Saving...' : student?._id ? 'Update' : 'Save'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}