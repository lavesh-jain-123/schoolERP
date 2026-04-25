import { useEffect, useState } from 'react';
import {
  Dialog, DialogTitle, DialogContent, DialogActions, Button, TextField,
  Grid, MenuItem, Alert, FormControlLabel, Checkbox, Typography, Box, Divider
} from '@mui/material';
import api from '../api/axios';

const roles = [
  { value: 'admin', label: 'Administrator (Full Access)' },
  { value: 'student_entry', label: 'Student Entry (Add Students Only)' },
  { value: 'fee_collector', label: 'Fee Collector (Collect Fees Only)' },
  { value: 'custom', label: 'Custom (Select Permissions)' },
];

const permissionGroups = {
  'Student Management': [
    { key: 'canViewStudents', label: 'View Students' },
    { key: 'canAddStudents', label: 'Add Students' },
    { key: 'canEditStudents', label: 'Edit Students' },
    { key: 'canDeleteStudents', label: 'Delete Students' },
  ],
  'Fee Management': [
    { key: 'canViewFees', label: 'View Fees' },
    { key: 'canCollectFees', label: 'Collect Fees' },
    { key: 'canDeleteFees', label: 'Delete Fees' },
    { key: 'canViewPendingFees', label: 'View Pending Fees' },
    { key: 'canSendFeeReminders', label: 'Send Fee Reminders' },
  ],
  'Family Management': [  // NEW
    { key: 'canViewFamilies', label: 'View Families' },
    { key: 'canManageFamilies', label: 'Manage Families (Add/Edit/Delete)' },
  ],
  'User Management': [
    { key: 'canManageUsers', label: 'Manage Users' },
  ],
};

const empty = {
  username: '',
  email: '',
  password: '',
  fullName: '',
  role: 'custom',
  isActive: true,
  permissions: {},
};

export default function UserFormDialog({ open, onClose, user, onSaved }) {
  const [form, setForm] = useState(empty);
  const [err, setErr] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (user) {
      setForm({ ...empty, ...user, password: '' }); // Don't pre-fill password
    } else {
      setForm(empty);
    }
    setErr('');
  }, [user, open]);

  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  const togglePermission = (key) => {
    setForm({
      ...form,
      permissions: {
        ...form.permissions,
        [key]: !form.permissions[key],
      },
    });
  };

  const submit = async () => {
    setSaving(true);
    setErr('');
    try {
      if (user?._id) {
        await api.put(`/users/${user._id}`, form);
      } else {
        await api.post('/users', form);
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
        {user?._id ? 'Edit User' : 'Add User'}
      </DialogTitle>
      <DialogContent dividers>
        {err && <Alert severity="error" sx={{ mb: 2 }}>{err}</Alert>}

        <Grid container spacing={2} sx={{ mt: 0.5 }}>
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="Username *"
              value={form.username}
              onChange={set('username')}
              disabled={!!user?._id}
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField fullWidth label="Full Name *" value={form.fullName} onChange={set('fullName')} />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField fullWidth label="Email *" type="email" value={form.email} onChange={set('email')} />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label={user?._id ? 'Password (leave blank to keep current)' : 'Password *'}
              type="password"
              value={form.password}
              onChange={set('password')}
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField select fullWidth label="Role *" value={form.role} onChange={set('role')}>
              {roles.map(r => <MenuItem key={r.value} value={r.value}>{r.label}</MenuItem>)}
            </TextField>
          </Grid>
          <Grid item xs={12} sm={6}>
            <FormControlLabel
              control={
                <Checkbox
                  checked={form.isActive}
                  onChange={(e) => setForm({ ...form, isActive: e.target.checked })}
                />
              }
              label="Active"
            />
          </Grid>
        </Grid>

        {form.role === 'custom' && (
          <>
            <Divider sx={{ my: 3 }} />
            <Typography variant="subtitle2" color="primary" fontWeight={600} gutterBottom>
              Custom Permissions
            </Typography>
            {Object.entries(permissionGroups).map(([group, perms]) => (
              <Box key={group} sx={{ mb: 2 }}>
                <Typography variant="caption" color="text.secondary" fontWeight={600} display="block" sx={{ mb: 1 }}>
                  {group}
                </Typography>
                <Grid container spacing={1}>
                  {perms.map(p => (
                    <Grid item xs={12} sm={6} key={p.key}>
                      <FormControlLabel
                        control={
                          <Checkbox
                            checked={!!form.permissions[p.key]}
                            onChange={() => togglePermission(p.key)}
                          />
                        }
                        label={p.label}
                      />
                    </Grid>
                  ))}
                </Grid>
              </Box>
            ))}
          </>
        )}

        {form.role !== 'custom' && form.role !== 'admin' && (
          <Alert severity="info" sx={{ mt: 2 }}>
            <Typography variant="caption">
              <strong>{roles.find(r => r.value === form.role)?.label}</strong> role has pre-defined permissions.
              Select "Custom" role to manually configure permissions.
            </Typography>
          </Alert>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button variant="contained" color="secondary" onClick={submit} disabled={saving}>
          {saving ? 'Saving...' : user?._id ? 'Update' : 'Create'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}