import { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Link, useLocation, Navigate } from 'react-router-dom';
import {
  AppBar, Toolbar, Box, CssBaseline, createTheme, ThemeProvider,
  Drawer, List, ListItem, ListItemButton, ListItemIcon, ListItemText,
  IconButton, Divider, Typography, Avatar, Menu, MenuItem
} from '@mui/material';
import {
  Menu as MenuIcon,
  ChevronLeft,
  People,
  Payment,
  Warning,
  Logout,
  Group,
  ManageAccounts,
} from '@mui/icons-material';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ToastProvider, useToast } from './context/ToastContext';
import { setToastFunction } from './api/axios';
import ProtectedRoute from './components/ProtectedRoute';
import Login from './pages/Auth/Login';
import Unauthorized from './pages/Auth/Unauthorized';
import StudentList from './pages/Students/StudentList';
import FeeList from './pages/Fees/FeeList';
import PendingFeesList from './pages/Fees/PendingFeesList';
import UserList from './Users/UserList';
import FamilyList from './pages/Families/FamilyList';


const theme = createTheme({
  palette: {
    primary: { main: '#1C2C56' },
    secondary: { main: '#8fc750' },
  },
});

const drawerWidth = 240;
const drawerWidthCollapsed = 65;

function Layout({ children }) {
  const [open, setOpen] = useState(true);
  const [anchorEl, setAnchorEl] = useState(null);
  const location = useLocation();
  const { user, logout, hasPermission } = useAuth();
  const { showSuccess } = useToast();

  const toggleDrawer = () => setOpen(!open);

  const handleLogout = () => {
    logout();
    showSuccess('Logged out successfully');
  };

 const menuItems = [
  { text: 'Students', icon: <People />, path: '/students', permission: 'canViewStudents' },
  { text: 'Families', icon: <Group />, path: '/families', permission: 'canViewFamilies' }, // CHANGED
  { text: 'Fee Payments', icon: <Payment />, path: '/fees', permission: 'canViewFees' },
  { text: 'Pending Fees', icon: <Warning />, path: '/pending-fees', permission: 'canViewPendingFees' },
  { text: 'Users', icon: <ManageAccounts />, path: '/users', permission: 'canManageUsers' },
].filter(item => hasPermission(item.permission));

  return (
    <Box sx={{ display: 'flex' }}>
      <AppBar position="fixed" sx={{ zIndex: (theme) => theme.zIndex.drawer + 1, bgcolor: '#1C2C56' }}>
        <Toolbar>
          <IconButton color="inherit" onClick={toggleDrawer} edge="start" sx={{ mr: 2 }}>
            {open ? <ChevronLeft /> : <MenuIcon />}
          </IconButton>
          <Box component="img" src= {`${window.location.origin}/logo.jpeg`} alt="Logo" sx={{ height: 40, width: 40, borderRadius: '50%', mr: 2, objectFit: 'cover', border: '2px solid #8fc750' }} />
          <Box sx={{ flexGrow: 1 }}>
            <Typography variant="h6" sx={{ fontWeight: 700, letterSpacing: 0.5 }}>
              The Dimension Public School
            </Typography>
            <Typography variant="caption" sx={{ opacity: 0.85 }}>
              School Management System
            </Typography>
          </Box>
          <IconButton color="inherit" onClick={(e) => setAnchorEl(e.currentTarget)}>
            <Avatar sx={{ bgcolor: '#8fc750', color: '#1C2C56', width: 36, height: 36 }}>
              {user?.fullName?.[0]?.toUpperCase()}
            </Avatar>
          </IconButton>
          <Menu anchorEl={anchorEl} open={Boolean(anchorEl)} onClose={() => setAnchorEl(null)}>
            <MenuItem disabled>
              <Box>
                <Typography variant="body2" fontWeight={600}>{user?.fullName}</Typography>
                <Typography variant="caption" color="text.secondary">{user?.role}</Typography>
              </Box>
            </MenuItem>
            <Divider />
            <MenuItem onClick={handleLogout}>
              <Logout fontSize="small" sx={{ mr: 1 }} /> Logout
            </MenuItem>
          </Menu>
        </Toolbar>
      </AppBar>

      <Drawer
        variant="permanent"
        open={open}
        sx={{
          width: open ? drawerWidth : drawerWidthCollapsed,
          flexShrink: 0,
          '& .MuiDrawer-paper': {
            width: open ? drawerWidth : drawerWidthCollapsed,
            boxSizing: 'border-box',
            transition: 'width 0.3s',
            overflowX: 'hidden',
            overflowY: open ? 'auto' : 'hidden',
            borderRight: '2px solid #e0e0e0',
          },
        }}
      >
        <Toolbar />
        <Box sx={{ overflow: 'auto', mt: 1 }}>
          <List>
            {menuItems.map((item) => {
              const isActive = location.pathname === item.path;
              return (
                <ListItem key={item.text} disablePadding sx={{ display: 'block' }}>
                  <ListItemButton
                    component={Link}
                    to={item.path}
                    sx={{
                      minHeight: 48,
                      justifyContent: open ? 'initial' : 'center',
                      px: 2.5,
                      bgcolor: isActive ? '#8fc75015' : 'transparent',
                      borderLeft: isActive ? '4px solid #8fc750' : '4px solid transparent',
                      '&:hover': { bgcolor: '#8fc75025' },
                    }}
                  >
                    <ListItemIcon
                      sx={{
                        minWidth: 0,
                        mr: open ? 3 : 'auto',
                        justifyContent: 'center',
                        color: isActive ? '#8fc750' : '#1C2C56',
                      }}
                    >
                      {item.icon}
                    </ListItemIcon>
                    {open && (
                      <ListItemText
                        primary={item.text}
                        sx={{
                          '& .MuiTypography-root': {
                            fontWeight: isActive ? 700 : 500,
                            color: isActive ? '#1C2C56' : 'text.primary',
                          },
                        }}
                      />
                    )}
                  </ListItemButton>
                </ListItem>
              );
            })}
          </List>
        </Box>
      </Drawer>

      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: 3,
          width: `calc(100% - ${open ? drawerWidth : drawerWidthCollapsed}px)`,
          transition: 'width 0.3s',
          bgcolor: '#f5f6fa',
          minHeight: '100vh',
        }}
      >
        <Toolbar />
        {children}
      </Box>
    </Box>
  );
}

function AppRoutes() {
  const { isAuthenticated } = useAuth();

  if (!isAuthenticated) {
    return (
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="*" element={<Navigate to="/login" replace />} />

      </Routes>
    );
  }

  return (
    <Layout>
      <Routes>
        <Route path="/" element={<Navigate to="/students" replace />} />
        <Route
          path="/students"
          element={
            <ProtectedRoute permission="canViewStudents">
              <StudentList />
            </ProtectedRoute>
          }
        />
        <Route
          path="/fees"
          element={
            <ProtectedRoute permission="canViewFees">
              <FeeList />
            </ProtectedRoute>
          }
        />
        <Route
          path="/pending-fees"
          element={
            <ProtectedRoute permission="canViewPendingFees">
              <PendingFeesList />
            </ProtectedRoute>
          }
        />
        <Route
          path="/users"
          element={
            <ProtectedRoute permission="canManageUsers">
              <UserList />
            </ProtectedRoute>
          }
        />
       <Route
  path="/families"
  element={
    <ProtectedRoute permission="canViewFamilies">
      <FamilyList />
    </ProtectedRoute>
  }
/>
        <Route path="/unauthorized" element={<Unauthorized />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Layout>
  );
}

function AppContent() {
  const { showError } = useToast();

  useEffect(() => {
    // Set toast function for axios interceptor
    setToastFunction(showError);
  }, [showError]);

  return <AppRoutes />;
}

export default function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <BrowserRouter>
        <AuthProvider>
          <ToastProvider>
            <AppContent />
          </ToastProvider>
        </AuthProvider>
      </BrowserRouter>
    </ThemeProvider>
  );
}