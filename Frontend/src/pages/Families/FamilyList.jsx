import { useEffect, useState } from 'react';
import {
  Paper, Typography, Table, TableBody, TableCell, TableHead, TableRow,
  IconButton, Chip, Stack, Button, Box, TextField, InputAdornment
} from '@mui/material';
import { Add, Edit, Delete, Search, People } from '@mui/icons-material';
import api from '../../api/axios';
import FamilyFormDialog from './FamilyFormDialog';
import { useToast } from '../../context/ToastContext';
import { useAuth } from '../../context/AuthContext';

export default function FamilyList() {
  const [families, setFamilies] = useState([]);
  const [search, setSearch] = useState('');
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const { showSuccess } = useToast();
   const { hasPermission } = useAuth(); 

  const load = async () => {
    const { data } = await api.get('/families', { params: { search } });
    setFamilies(data.data);
  };

  useEffect(() => { load(); }, []);
  useEffect(() => { const t = setTimeout(load, 300); return () => clearTimeout(t); }, [search]);

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this family? Students will be unlinked but not deleted.')) return;
    await api.delete(`/families/${id}`);
    showSuccess('Family deleted successfully');
    load();
  };

  return (
    <Paper sx={{ p: 3 }}>
      <Stack direction="row" justifyContent="space-between" alignItems="center" mb={3}>
        <Box>
          <Typography variant="h5" color="primary" fontWeight={700}>
            Family Management
          </Typography>
          <Typography variant="caption" color="text.secondary">
            Group siblings and manage family information
          </Typography>
        </Box>
          {hasPermission('canManageFamilies') && (
        <Button
          variant="contained"
          color="secondary"
          startIcon={<Add />}
          onClick={() => { setEditing(null); setFormOpen(true); }}
        >
          Add Family
        </Button>
          )}
      </Stack>

      <TextField
        placeholder="Search by Family ID, Parent Name, or Mobile..."
        size="small"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        sx={{ mb: 2, width: 400 }}
        InputProps={{
          startAdornment: (
            <InputAdornment position="start">
              <Search />
            </InputAdornment>
          ),
        }}
      />

      <Table size="small">
        <TableHead>
          <TableRow sx={{ '& th': { fontWeight: 700, bgcolor: '#1C2C56', color: '#fff' } }}>
            <TableCell>Family ID</TableCell>
            <TableCell>Parent Name</TableCell>
            <TableCell>Contact</TableCell>
            <TableCell>Students</TableCell>
            <TableCell>Created</TableCell>
         {hasPermission('canManageFamilies') && (      <TableCell align="right">Actions</TableCell> )}
          </TableRow>
        </TableHead>
        <TableBody>
          {families.map((fam) => (
            <TableRow key={fam._id} hover>
              <TableCell sx={{ fontWeight: 600 }}>{fam.familyId}</TableCell>
              <TableCell>{fam.parentName}</TableCell>
              <TableCell>
                <Typography variant="body2">{fam.parentMobile}</Typography>
                {fam.parentEmail && (
                  <Typography variant="caption" color="text.secondary">
                    {fam.parentEmail}
                  </Typography>
                )}
              </TableCell>
              <TableCell>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                  {fam.students?.length > 0 ? (
                    fam.students.map(s => (
                      <Chip
                        key={s._id}
                        label={`${s.firstName} ${s.lastName} - ${s.className}${s.section}`}
                        size="small"
                        color={s.status === 'Active' ? 'success' : 'default'}
                        icon={<People />}
                      />
                    ))
                  ) : (
                    <Typography variant="caption" color="text.secondary">
                      No students linked
                    </Typography>
                  )}
                </Box>
              </TableCell>
              <TableCell>
                {new Date(fam.createdAt).toLocaleDateString()}
              </TableCell>
               {hasPermission('canManageFamilies') && (
              <TableCell align="right">
                <IconButton
                  color="primary"
                  onClick={() => { setEditing(fam); setFormOpen(true); }}
                >
                  <Edit />
                </IconButton>
                <IconButton color="error" onClick={() => handleDelete(fam._id)}>
                  <Delete />
                </IconButton>
              </TableCell> )}
            </TableRow>
          ))}
          {families.length === 0 && (
            <TableRow>
              <TableCell colSpan={6} align="center" sx={{ py: 4 }}>
                <Typography variant="body2" color="text.secondary">
                  No families found. Click "Add Family" to create one.
                </Typography>
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>

      <FamilyFormDialog
        open={formOpen}
        onClose={() => setFormOpen(false)}
        family={editing}
        onSaved={() => { setFormOpen(false); showSuccess(editing ? 'Family updated' : 'Family created'); load(); }}
      />
    </Paper>
  );
}