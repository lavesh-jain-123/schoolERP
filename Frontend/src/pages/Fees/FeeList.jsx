import { useEffect, useState } from 'react';
import {
  Paper, Typography, Table, TableBody, TableCell, TableHead, TableRow,
  Chip, IconButton, Tooltip, Stack, Button
} from '@mui/material';
import { Sms, Delete, Print } from '@mui/icons-material';
import api from '../../api/axios';
import { openReceipt } from '../../utils/printReceipt';
import { useToast } from '../../context/ToastContext';

const statusColor = { Sent: 'success', Failed: 'error', Pending: 'warning', 'Not Sent': 'default' };

export default function FeeList() {
  const [fees, setFees] = useState([]);
   const { showSuccess, showError } = useToast();

  const load = async () => {
    const { data } = await api.get('/fees');
    setFees(data.data);
  };
  useEffect(() => { load(); }, []);

  const resend = async (id) => {
    try {
      await api.post(`/fees/${id}/resend-sms`);
      showSuccess('SMS sent successfully');
      load();
    } catch (err) {
      // Error handled by interceptor
    }
  };

  const del = async (id) => {
    if (!window.confirm('Delete this payment?')) return;
    try {
      await api.delete(`/fees/${id}`);
      showSuccess('Payment deleted successfully');
      load();
    } catch (err) {
      // Error handled by interceptor
    }
  };

  const handlePrint = (fee) => {
    try {
      openReceipt({
        student: fee.student || {},
        payment: fee,
      });
      showSuccess('Receipt opened in new tab');
    } catch (err) {
      showError('Failed to open receipt');
    }
  };




  return (
    <Paper sx={{ p: 3 }}>
      <Stack direction="row" justifyContent="space-between" mb={2}>
        <Typography variant="h5" color="primary" fontWeight={700}>Fee Payments</Typography>
        <Button variant="outlined" onClick={load}>Refresh</Button>
      </Stack>
      <Table size="small">
        <TableHead>
          <TableRow sx={{ '& th': { fontWeight: 700, bgcolor: '#f5f6fa' } }}>
            <TableCell>Receipt</TableCell>
            <TableCell>Date</TableCell>
            <TableCell>Student</TableCell>
            <TableCell>Class</TableCell>
            <TableCell>Fee Type</TableCell>
            <TableCell>Amount</TableCell>
            <TableCell>Mode</TableCell>
            <TableCell>SMS</TableCell>
            <TableCell align="right">Actions</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {fees.map((f) => (
            <TableRow key={f._id} hover>
              <TableCell>{f.receiptNo}</TableCell>
              <TableCell>{new Date(f.paymentDate).toLocaleDateString()}</TableCell>
              <TableCell>{f.student?.firstName} {f.student?.lastName}</TableCell>
              <TableCell>{f.student?.className}-{f.student?.section}</TableCell>
              <TableCell>{f.feeType}</TableCell>
              <TableCell>₹{f.amount}</TableCell>
              <TableCell>{f.paymentMode}</TableCell>
              <TableCell>
                <Tooltip title={f.smsError || ''}>
                  <Chip size="small" label={f.smsStatus} color={statusColor[f.smsStatus] || 'default'} />
                </Tooltip>
              </TableCell>
              <TableCell align="right">
                <Tooltip title="Print / Download Receipt">
                  <IconButton color="primary" onClick={() => handlePrint(f)}>
                    <Print />
                  </IconButton>
                </Tooltip>
                {f.smsStatus !== 'Sent' && (
                  <Tooltip title="Resend SMS">
                    <IconButton color="secondary" onClick={() => resend(f._id)}>
                      <Sms />
                    </IconButton>
                  </Tooltip>
                )}
                <Tooltip title="Delete">
                  <IconButton color="error" onClick={() => del(f._id)}><Delete /></IconButton>
                </Tooltip>
              </TableCell>
            </TableRow>
          ))}
          {fees.length === 0 && (
            <TableRow>
              <TableCell colSpan={9} align="center" sx={{ py: 4, color: 'text.secondary' }}>
                No payments yet
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </Paper>
  );
}