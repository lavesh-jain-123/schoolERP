import { useEffect, useState } from 'react';
import {
  Paper, Typography, Table, TableBody, TableCell, TableHead, TableRow,
  IconButton, Chip, Stack, Button, Box
} from '@mui/material';
import { Add, Edit, Delete } from '@mui/icons-material';
import api from '../api/axios';
import UserFormDialog from './UserFormDialog';
import { useToast } from '../context/ToastContext';

const roleColors = {
  admin: 'error',
  student_entry: 'primary',
  fee_collector: 'secondary',
  custom: 'default',
};

const roleLabels = {
  admin: 'Administrator',
  student_entry: 'Student Entry',
  fee_collector: 'Fee Collector',
  custom: 'Custom',
};

export default function UserList() {
  const [users, setUsers] = useState([]);
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState(null);

   const { showSuccess } = useToast();

  const load = async () => {
    const { data } = await api.get('/users');
    setUsers(data.data);
  };

  useEffect(() => { load(); }, []);

 const handleDelete = async (id) => {
    if (!window.confirm('Delete this user?')) return;
    try {
      await api.delete(`/users/${id}`);
      showSuccess('User deleted successfully');
      load();
    } catch (err) {
      // Error handled by interceptor
    }
  };

  return (
    <Paper sx={{ p: 3 }}>
      <Stack direction="row" justifyContent="space-between" alignItems="center" mb={3}>
        <Box>
          <Typography variant="h5" color="primary" fontWeight={700}>
            User Management
          </Typography>
          <Typography variant="caption" color="text.secondary">
            Manage system users and their permissions
          </Typography>
        </Box>
        <Button
          variant="contained"
          color="secondary"
          startIcon={<Add />}
          onClick={() => { setEditing(null); setFormOpen(true); }}
        >
          Add User
        </Button>
      </Stack>

      <Table size="small">
        <TableHead>
          <TableRow sx={{ '& th': { fontWeight: 700, bgcolor: '#1C2C56', color: '#fff' } }}>
            <TableCell>Username</TableCell>
            <TableCell>Full Name</TableCell>
            <TableCell>Email</TableCell>
            <TableCell>Role</TableCell>
            <TableCell>Status</TableCell>
            <TableCell>Last Login</TableCell>
            <TableCell align="right">Actions</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {users.map((u) => (
            <TableRow key={u._id} hover>
              <TableCell sx={{ fontWeight: 600 }}>{u.username}</TableCell>
              <TableCell>{u.fullName}</TableCell>
              <TableCell>{u.email}</TableCell>
              <TableCell>
                <Chip
                  label={roleLabels[u.role]}
                  size="small"
                  color={roleColors[u.role]}
                  sx={{ fontWeight: 600 }}
                />
              </TableCell>
              <TableCell>
                <Chip
                  label={u.isActive ? 'Active' : 'Inactive'}
                  size="small"
                  color={u.isActive ? 'success' : 'default'}
                />
              </TableCell>
              <TableCell>
                {u.lastLogin ? new Date(u.lastLogin).toLocaleString() : 'Never'}
              </TableCell>
              <TableCell align="right">
                <IconButton
                  color="primary"
                  onClick={() => { setEditing(u); setFormOpen(true); }}
                >
                  <Edit />
                </IconButton>
                <IconButton color="error" onClick={() => handleDelete(u._id)}>
                  <Delete />
                </IconButton>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      <UserFormDialog
        open={formOpen}
        onClose={() => setFormOpen(false)}
        user={editing}
        onSaved={() => {
    setFormOpen(false);
    showSuccess(editing ? 'User updated successfully' : 'User created successfully');
    load();
  }}
      />
    </Paper>
  );
}