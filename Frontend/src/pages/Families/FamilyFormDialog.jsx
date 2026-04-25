import { useEffect, useState } from 'react';
import {
  Dialog, DialogTitle, DialogContent, DialogActions, Button, TextField,
  Grid, Alert, Typography, Box, Chip, IconButton, Autocomplete
} from '@mui/material';
import { Add, Delete } from '@mui/icons-material';
import api from '../../api/axios';

const empty = {
  parentName: '',
  parentMobile: '',
  parentEmail: '',
  address: '',
};

export default function FamilyFormDialog({ open, onClose, family, onSaved }) {
  const [form, setForm] = useState(empty);
  const [err, setErr] = useState('');
  const [saving, setSaving] = useState(false);
  const [allStudents, setAllStudents] = useState([]);
  const [linkedStudents, setLinkedStudents] = useState([]);
  const [studentToAdd, setStudentToAdd] = useState(null);

  useEffect(() => {
    if (family) {
      setForm({
        parentName: family.parentName || '',
        parentMobile: family.parentMobile || '',
        parentEmail: family.parentEmail || '',
        address: family.address || '',
      });
      setLinkedStudents(family.students || []);
    } else {
      setForm(empty);
      setLinkedStudents([]);
    }
    setErr('');
    loadStudents();
    // eslint-disable-next-line
  }, [family, open]);

  const loadStudents = async () => {
    try {
      const { data } = await api.get('/students');
      // Only show students without a family or in current family
      const available = data.data.filter(s => 
        !s.family || (family && s.family === family._id)
      );
      setAllStudents(available);
    } catch (e) {
      console.error('Failed to load students:', e);
    }
  };

  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  const submit = async () => {
    setSaving(true);
    setErr('');
    try {
      if (family?._id) {
        await api.put(`/families/${family._id}`, form);
      } else {
        await api.post('/families', form);
      }
      onSaved?.();
    } catch (e) {
      setErr(e.response?.data?.message || e.message);
    } finally {
      setSaving(false);
    }
  };

  const addStudent = async () => {
    if (!studentToAdd || !family?._id) return;
    try {
      await api.post(`/families/${family._id}/add-student`, { studentId: studentToAdd._id });
      setLinkedStudents([...linkedStudents, studentToAdd]);
      setStudentToAdd(null);
      loadStudents();
    } catch (e) {
      setErr(e.response?.data?.message || e.message);
    }
  };

  const removeStudent = async (studentId) => {
    if (!family?._id) return;
    try {
      await api.post(`/families/${family._id}/remove-student`, { studentId });
      setLinkedStudents(linkedStudents.filter(s => s._id !== studentId));
      loadStudents();
    } catch (e) {
      setErr(e.response?.data?.message || e.message);
    }
  };

  const availableStudents = allStudents.filter(s => 
    !linkedStudents.find(ls => ls._id === s._id)
  );

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle sx={{ bgcolor: '#1C2C56', color: '#fff' }}>
        {family?._id ? 'Edit Family' : 'Add Family'}
      </DialogTitle>
      <DialogContent dividers>
        {err && <Alert severity="error" sx={{ mb: 2 }}>{err}</Alert>}

        <Grid container spacing={2} sx={{ mt: 0.5 }}>
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="Parent Name *"
              value={form.parentName}
              onChange={set('parentName')}
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="Parent Mobile *"
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
              label="Address"
              value={form.address}
              onChange={set('address')}
            />
          </Grid>
        </Grid>

        {family?._id && (
          <>
            <Box sx={{ mt: 3, mb: 2 }}>
              <Typography variant="subtitle2" fontWeight={600} gutterBottom>
                Linked Students ({linkedStudents.length})
              </Typography>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 2 }}>
                {linkedStudents.map(s => (
                  <Chip
                    key={s._id}
                    label={`${s.firstName} ${s.lastName} - ${s.className}${s.section} (${s.admissionNo})`}
                    onDelete={() => removeStudent(s._id)}
                    color="primary"
                  />
                ))}
                {linkedStudents.length === 0 && (
                  <Typography variant="caption" color="text.secondary">
                    No students linked yet
                  </Typography>
                )}
              </Box>

              <Typography variant="subtitle2" fontWeight={600} gutterBottom>
                Add Student to Family
              </Typography>
              <Box sx={{ display: 'flex', gap: 1 }}>
                <Autocomplete
                  fullWidth
                  options={availableStudents}
                  getOptionLabel={(s) => `${s.firstName} ${s.lastName} - ${s.className}${s.section} (${s.admissionNo})`}
                  value={studentToAdd}
                  onChange={(e, val) => setStudentToAdd(val)}
                  renderInput={(params) => (
                    <TextField {...params} label="Select Student" size="small" />
                  )}
                />
                <Button
                  variant="contained"
                  onClick={addStudent}
                  disabled={!studentToAdd}
                  startIcon={<Add />}
                >
                  Add
                </Button>
              </Box>
            </Box>
          </>
        )}

        {!family?._id && (
          <Alert severity="info" sx={{ mt: 2 }}>
            Save the family first, then you can link students.
          </Alert>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button variant="contained" color="secondary" onClick={submit} disabled={saving}>
          {saving ? 'Saving...' : family?._id ? 'Update' : 'Create'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}