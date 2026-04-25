import { useEffect, useState } from 'react';
import {
  Box, Paper, Typography, Button, TextField, Table, TableBody, TableCell,
  TableHead, TableRow, IconButton, Chip, Stack, Grid, MenuItem, Card, CardContent
} from '@mui/material';
import { Add, Edit, Delete, Payments, Search, FilterAlt, Clear } from '@mui/icons-material';
import api from '../../api/axios';
import StudentFormDialog from './StudentFormDialog';
import CollectFeeDialog from '../Fees/CollectFeeDialog';
import { useToast } from '../../context/ToastContext';

export default function StudentList() {
  const [students, setStudents] = useState([]);
  const [allStudents, setAllStudents] = useState([]); // For stats
  const [filters, setFilters] = useState({
    search: '',
    className: '',
    section: '',
    status: '',
  });
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [feeOpen, setFeeOpen] = useState(false);
  const [feeStudent, setFeeStudent] = useState(null);
   const { showSuccess, showError } = useToast();

  const load = async () => {
    const params = {};
    if (filters.search) params.search = filters.search;
    if (filters.className) params.className = filters.className;
    if (filters.section) params.section = filters.section;
    if (filters.status) params.status = filters.status;

    const { data } = await api.get('/students', { params });
    setStudents(data.data);
  };

    const handleDelete = async (id) => {
    if (!window.confirm('Delete this student?')) return;
    try {
      await api.delete(`/students/${id}`);
      showSuccess('Student deleted successfully');
      load();
      loadAll();
    } catch (err) {
      // Error already handled by axios interceptor
      // Optional: add specific error handling here if needed
    }
  };
  const loadAll = async () => {
    const { data } = await api.get('/students');
    setAllStudents(data.data);
  };

  useEffect(() => {
    load();
    loadAll();
    // eslint-disable-next-line
  }, []);

  

  const setFilter = (key) => (e) => {
    setFilters({ ...filters, [key]: e.target.value });
  };

  const clearFilters = () => {
    setFilters({ search: '', className: '', section: '', status: '' });
    setTimeout(() => {
      load();
    }, 100);
  };

  // Extract unique classes and sections from all students
  const uniqueClasses = [...new Set(allStudents.map(s => s.className))].filter(Boolean).sort();
  const uniqueSections = [...new Set(allStudents.map(s => s.section))].filter(Boolean).sort();

  // Stats
  const totalStudents = allStudents.length;
  const activeStudents = allStudents.filter(s => s.status === 'Active').length;
  const inactiveStudents = allStudents.filter(s => s.status === 'Inactive').length;

  return (
    <Box>
      {/* Summary Cards */}
      <Grid container spacing={2} mb={3}>
        <Grid item xs={12} sm={4}>
          <Card sx={{ bgcolor: '#e3f2fd', border: '1px solid #2196f3' }}>
            <CardContent sx={{ py: 2 }}>
              <Typography variant="caption" color="text.secondary">Total Students</Typography>
              <Typography variant="h4" color="#1976d2" fontWeight={700}>{totalStudents}</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={4}>
          <Card sx={{ bgcolor: '#e8f5e9', border: '1px solid #4caf50' }}>
            <CardContent sx={{ py: 2 }}>
              <Typography variant="caption" color="text.secondary">Active Students</Typography>
              <Typography variant="h4" color="#2e7d32" fontWeight={700}>{activeStudents}</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={4}>
          <Card sx={{ bgcolor: '#fce4ec', border: '1px solid #e91e63' }}>
            <CardContent sx={{ py: 2 }}>
              <Typography variant="caption" color="text.secondary">Inactive Students</Typography>
              <Typography variant="h4" color="#c2185b" fontWeight={700}>{inactiveStudents}</Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Main Content */}
      <Paper sx={{ p: 3 }}>
        <Stack direction="row" justifyContent="space-between" alignItems="center" mb={3}>
          <Box>
            <Typography variant="h5" color="primary" fontWeight={700}>
              Students Directory
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Showing {students.length} student{students.length !== 1 ? 's' : ''}
            </Typography>
          </Box>
          <Button
            variant="contained"
            color="secondary"
            startIcon={<Add />}
            onClick={() => { setEditing(null); setFormOpen(true); }}
            sx={{ boxShadow: 2 }}
          >
            Add Student
          </Button>
        </Stack>

        {/* Filters Section */}
        <Paper sx={{ p: 2, mb: 3, bgcolor: '#f5f6fa', border: '1px solid #e0e0e0' }}>
          <Stack direction="row" alignItems="center" spacing={1} mb={2}>
            <FilterAlt color="primary" />
            <Typography variant="subtitle2" fontWeight={600} color="primary">
              Filters
            </Typography>
          </Stack>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6} md={3}>
              <TextField
                fullWidth
                size="small"
                label="Search"
                placeholder="Name, Adm No, Mobile"
                value={filters.search}
                onChange={setFilter('search')}
                onKeyDown={(e) => e.key === 'Enter' && load()}
              />
            </Grid>
            <Grid item xs={12} sm={6} md={2}>
              <TextField
                select
                fullWidth
                size="small"
                label="Class"
                value={filters.className}
                onChange={setFilter('className')}
              >
                <MenuItem value="">All Classes</MenuItem>
                {uniqueClasses.map(c => (
                  <MenuItem key={c} value={c}>{c}</MenuItem>
                ))}
              </TextField>
            </Grid>
            <Grid item xs={12} sm={6} md={2}>
              <TextField
                select
                fullWidth
                size="small"
                label="Section"
                value={filters.section}
                onChange={setFilter('section')}
              >
                <MenuItem value="">All Sections</MenuItem>
                {uniqueSections.map(s => (
                  <MenuItem key={s} value={s}>{s}</MenuItem>
                ))}
              </TextField>
            </Grid>
            <Grid item xs={12} sm={6} md={2}>
              <TextField
                select
                fullWidth
                size="small"
                label="Status"
                value={filters.status}
                onChange={setFilter('status')}
              >
                <MenuItem value="">All Status</MenuItem>
                <MenuItem value="Active">Active</MenuItem>
                <MenuItem value="Inactive">Inactive</MenuItem>
              </TextField>
            </Grid>
            <Grid item xs={12} sm={12} md={3}>
              <Stack direction="row" spacing={1}>
                <Button
                  variant="contained"
                  startIcon={<Search />}
                  onClick={load}
                  fullWidth
                >
                  Search
                </Button>
                <Button
                  variant="outlined"
                  startIcon={<Clear />}
                  onClick={clearFilters}
                >
                  Clear
                </Button>
              </Stack>
            </Grid>
          </Grid>
        </Paper>

        {/* Table */}
        <Box sx={{ overflowX: 'auto' }}>
          <Table size="small">
            <TableHead>
              <TableRow sx={{ '& th': { fontWeight: 700, bgcolor: '#1C2C56', color: '#fff' } }}>
                <TableCell>Adm. No</TableCell>
                <TableCell>Name</TableCell>
                <TableCell>Class</TableCell>
                <TableCell>Parent</TableCell>
                <TableCell>Mobile</TableCell>
                <TableCell align="right">Monthly Fee</TableCell>
                <TableCell>Status</TableCell>
                <TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {students.map((s) => (
                <TableRow
                  key={s._id}
                  hover
                  sx={{
                    '&:hover': { bgcolor: '#f5f6fa' },
                    transition: 'background-color 0.2s',
                  }}
                >
                  <TableCell sx={{ fontWeight: 600 }}>{s.admissionNo}</TableCell>
                  <TableCell>
                    <Typography variant="body2" fontWeight={600}>
                      {s.firstName} {s.lastName}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={`${s.className}-${s.section}`}
                      size="small"
                      sx={{ bgcolor: '#e3f2fd', color: '#1976d2', fontWeight: 600 }}
                    />
                  </TableCell>
                  <TableCell>{s.parentName}</TableCell>
                  <TableCell>{s.parentMobile}</TableCell>
                  <TableCell align="right">
                    <Typography variant="body2" fontWeight={600} color="primary">
                      ₹{s.monthlyFee?.toLocaleString() || 0}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={s.status}
                      size="small"
                      color={s.status === 'Active' ? 'success' : 'default'}
                    />
                  </TableCell>
                  <TableCell align="right">
                    <IconButton
                      color="secondary"
                      title="Collect Fee"
                      onClick={() => { setFeeStudent(s); setFeeOpen(true); }}
                      sx={{ '&:hover': { bgcolor: '#8fc75020' } }}
                    >
                      <Payments />
                    </IconButton>
                    <IconButton
                      color="primary"
                      title="Edit"
                      onClick={() => { setEditing(s); setFormOpen(true); }}
                      sx={{ '&:hover': { bgcolor: '#1C2C5610' } }}
                    >
                      <Edit />
                    </IconButton>
                    <IconButton
                      color="error"
                      title="Delete"
                      onClick={() => handleDelete(s._id)}
                      sx={{ '&:hover': { bgcolor: '#f4433620' } }}
                    >
                      <Delete />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))}
              {students.length === 0 && (
                <TableRow>
                  <TableCell colSpan={8} align="center" sx={{ py: 6 }}>
                    <Typography variant="body1" color="text.secondary" fontWeight={500}>
                      No students found
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      Try adjusting your filters or add a new student
                    </Typography>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </Box>
      </Paper>

      <StudentFormDialog
        open={formOpen}
        onClose={() => setFormOpen(false)}
        student={editing}
      onSaved={() => {
    setFormOpen(false);
    showSuccess(editing ? 'Student updated successfully' : 'Student added successfully');
    load();
    loadAll();
  }}

      />

      <CollectFeeDialog
        open={feeOpen}
        onClose={() => setFeeOpen(false)}
        student={feeStudent}
       onSaved={(data) => {
    setFeeOpen(false);
    showSuccess(`Fee collected successfully. Receipt: ${data.receiptNo}`);
  }}
      />
    </Box>
  );
}