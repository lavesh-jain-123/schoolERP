import { useEffect, useState } from 'react';
import {
  Paper, Typography, Table, TableBody, TableCell, TableHead, TableRow,
  Chip, IconButton, Tooltip, Stack, Button, TextField, MenuItem, Grid, Alert
} from '@mui/material';
import { Sms, Refresh } from '@mui/icons-material';
import api from '../../api/axios';
import { useToast } from '../../context/ToastContext';

export default function PendingFeesList() {
  const [students, setStudents] = useState([]);
  const [filters, setFilters] = useState({
    className: '',
    section: '',
    search: '',
    minPending: '',
  });
  const [sending, setSending] = useState({});
  const [alert, setAlert] = useState(null);
  const { showSuccess, showError } = useToast();

  const load = async () => {
    const params = {};
    if (filters.className) params.className = filters.className;
    if (filters.section) params.section = filters.section;
    if (filters.search) params.search = filters.search;
    if (filters.minPending) params.minPending = filters.minPending;
    
    const { data } = await api.get('/students/pending-fees', { params });
    setStudents(data.data);
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line
  }, []);

  const setFilter = (k) => (e) => setFilters({ ...filters, [k]: e.target.value });

  const sendReminder = async (student) => {
    setSending({ ...sending, [student._id]: true });
    try {
      const { data } = await api.post(`/students/${student._id}/send-pending-sms`, {
        monthsPending: student.monthsPending,
        totalDue: student.totalDue,
      });
      
      if (data.success) {
        showSuccess(`SMS reminder sent to ${student.parentName} (${student.parentMobile})`);
      } else {
        showError(`SMS failed: ${data.error || 'Unknown error'}`);
      }
    } catch (err) {
      // Error handled by interceptor
    } finally {
      setSending({ ...sending, [student._id]: false });
    }
  };

  const totalPendingAmount = students.reduce((sum, s) => sum + (s.totalDue || 0), 0);
  const totalPendingStudents = students.filter(s => s.monthsPending > 0).length;

  return (
    <Paper sx={{ p: 3 }}>
      <Stack direction="row" justifyContent="space-between" alignItems="center" mb={2}>
        <Typography variant="h5" color="primary" fontWeight={700}>
          Pending Fee Report
        </Typography>
        <Button variant="outlined" startIcon={<Refresh />} onClick={load}>
          Refresh
        </Button>
      </Stack>

      {/* Summary Cards */}
      <Grid container spacing={2} mb={3}>
        <Grid item xs={12} sm={4}>
          <Paper sx={{ p: 2, bgcolor: '#fff3cd', border: '1px solid #ffc107' }}>
            <Typography variant="caption" color="text.secondary">Students with Pending Fees</Typography>
            <Typography variant="h4" color="#856404" fontWeight={700}>{totalPendingStudents}</Typography>
          </Paper>
        </Grid>
        <Grid item xs={12} sm={4}>
          <Paper sx={{ p: 2, bgcolor: '#f8d7da', border: '1px solid #dc3545' }}>
            <Typography variant="caption" color="text.secondary">Total Pending Amount</Typography>
            <Typography variant="h4" color="#721c24" fontWeight={700}>₹{totalPendingAmount.toLocaleString()}</Typography>
          </Paper>
        </Grid>
        <Grid item xs={12} sm={4}>
          <Paper sx={{ p: 2, bgcolor: '#d4edda', border: '1px solid #28a745' }}>
            <Typography variant="caption" color="text.secondary">Total Students</Typography>
            <Typography variant="h4" color="#155724" fontWeight={700}>{students.length}</Typography>
          </Paper>
        </Grid>
      </Grid>

      {alert && (
        <Alert severity={alert.type} onClose={() => setAlert(null)} sx={{ mb: 2 }}>
          {alert.msg}
        </Alert>
      )}

      {/* Filters */}
      <Grid container spacing={2} mb={2}>
        <Grid item xs={12} sm={3}>
          <TextField
            fullWidth
            size="small"
            label="Search name / admission no"
            value={filters.search}
            onChange={setFilter('search')}
            onKeyDown={(e) => e.key === 'Enter' && load()}
          />
        </Grid>
        <Grid item xs={12} sm={2}>
          <TextField
            fullWidth
            size="small"
            label="Class"
            value={filters.className}
            onChange={setFilter('className')}
          />
        </Grid>
        <Grid item xs={12} sm={2}>
          <TextField
            fullWidth
            size="small"
            label="Section"
            value={filters.section}
            onChange={setFilter('section')}
          />
        </Grid>
        <Grid item xs={12} sm={2}>
          <TextField
            select
            fullWidth
            size="small"
            label="Min Pending"
            value={filters.minPending}
            onChange={setFilter('minPending')}
          >
            <MenuItem value="">All</MenuItem>
            <MenuItem value="1">1+ months</MenuItem>
            <MenuItem value="2">2+ months</MenuItem>
            <MenuItem value="3">3+ months</MenuItem>
            <MenuItem value="6">6+ months</MenuItem>
          </TextField>
        </Grid>
        <Grid item xs={12} sm={3}>
          <Stack direction="row" spacing={1}>
            <Button variant="contained" onClick={load} fullWidth>
              Apply Filters
            </Button>
            <Button
              variant="outlined"
              onClick={() => {
                setFilters({ className: '', section: '', search: '', minPending: '' });
                setTimeout(load, 100);
              }}
            >
              Clear
            </Button>
          </Stack>
        </Grid>
      </Grid>

      {/* Table */}
      <Table size="small">
        <TableHead>
          <TableRow sx={{ '& th': { fontWeight: 700, bgcolor: '#f5f6fa' } }}>
            <TableCell>Adm No</TableCell>
            <TableCell>Student Name</TableCell>
            <TableCell>Class</TableCell>
            <TableCell>Parent</TableCell>
            <TableCell>Mobile</TableCell>
            <TableCell align="right">Monthly Fee</TableCell>
            <TableCell align="center">Months Pending</TableCell>
            <TableCell align="right">Total Due</TableCell>
            <TableCell align="right">Actions</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {students.map((s) => (
            <TableRow
              key={s._id}
              hover
              sx={{
                bgcolor: s.monthsPending >= 3 ? '#fff3cd' : s.monthsPending >= 1 ? '#f8d7da11' : 'inherit',
              }}
            >
              <TableCell>{s.admissionNo}</TableCell>
              <TableCell>
                <strong>{s.firstName} {s.lastName}</strong>
              </TableCell>
              <TableCell>{s.className}-{s.section}</TableCell>
              <TableCell>{s.parentName}</TableCell>
              <TableCell>{s.parentMobile}</TableCell>
              <TableCell align="right">₹{s.monthlyFee || 0}</TableCell>
              <TableCell align="center">
                <Chip
                  label={s.monthsPending}
                  size="small"
                  color={s.monthsPending >= 3 ? 'error' : s.monthsPending >= 1 ? 'warning' : 'success'}
                  sx={{ fontWeight: 700, minWidth: 40 }}
                />
                <Typography variant="caption" display="block" color="text.secondary">
                  ({s.paidCount}/{s.expectedMonths} paid)
                </Typography>
              </TableCell>
              <TableCell align="right">
                <Typography variant="body2" fontWeight={s.totalDue > 0 ? 700 : 400} color={s.totalDue > 0 ? 'error.main' : 'text.secondary'}>
                  ₹{s.totalDue.toLocaleString()}
                </Typography>
              </TableCell>
              <TableCell align="right">
                {s.monthsPending > 0 && (
                  <Tooltip title="Send Fee Reminder SMS">
                    <IconButton
                      color="warning"
                      onClick={() => sendReminder(s)}
                      disabled={sending[s._id]}
                    >
                      <Sms />
                    </IconButton>
                  </Tooltip>
                )}
              </TableCell>
            </TableRow>
          ))}
          {students.length === 0 && (
            <TableRow>
              <TableCell colSpan={9} align="center" sx={{ py: 4, color: 'text.secondary' }}>
                No students found
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </Paper>
  );
}