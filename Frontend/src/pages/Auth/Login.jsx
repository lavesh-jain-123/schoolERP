import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box, Card, CardContent, TextField, Button, Typography, Alert,
  InputAdornment, IconButton
} from '@mui/material';
import { Visibility, VisibilityOff, School } from '@mui/icons-material';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';

export default function Login() {
  const [form, setForm] = useState({ username: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();
   const { showSuccess } = useToast();

   const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await login(form.username, form.password);
      showSuccess('Login successful!');
      navigate('/students');
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(135deg, #1C2C56 0%, #2a3f73 100%)',
        p: 2,
      }}
    >
      <Card sx={{ maxWidth: 450, width: '100%', boxShadow: 6 }}>
        <CardContent sx={{ p: 4 }}>
         <Box sx={{ textAlign: 'center', mb: 4 }}>
  <img 
    src={`${window.location.origin}/logo.jpeg`} 
    alt="logo"
    style={{ width: 80, marginBottom: 10 }}
  />

  <Typography variant="h4" fontWeight={700} color="primary" gutterBottom>
    The Dimension Public School
  </Typography>

  <Typography variant="body2" color="text.secondary">
    Management System Login
  </Typography>
</Box>

          {error && <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>}

          <form onSubmit={handleSubmit}>
            <TextField
              fullWidth
              label="Username"
              value={form.username}
              onChange={(e) => setForm({ ...form, username: e.target.value })}
              margin="normal"
              required
              autoFocus
            />
            <TextField
              fullWidth
              label="Password"
              type={showPassword ? 'text' : 'password'}
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              margin="normal"
              required
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton onClick={() => setShowPassword(!showPassword)} edge="end">
                      {showPassword ? <VisibilityOff /> : <Visibility />}
                    </IconButton>
                  </InputAdornment>
                ),
              }}
            />
            <Button
              type="submit"
              fullWidth
              variant="contained"
              size="large"
              disabled={loading}
              sx={{ mt: 3, mb: 2, py: 1.5, bgcolor: '#1C2C56' }}
            >
              {loading ? 'Logging in...' : 'Login'}
            </Button>
          </form>

         
        </CardContent>
      </Card>
    </Box>
  );
}