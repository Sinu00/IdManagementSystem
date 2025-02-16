import { AppBar, Toolbar, Typography, Button, Box } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import NotificationsIcon from '@mui/icons-material/Notifications';
import { useState, useEffect } from 'react';
import { notificationApi } from '../services/api';

function Navbar() {
  const { admin, logout } = useAuth();
  const navigate = useNavigate();
  const [expiringCount, setExpiringCount] = useState(0);

  useEffect(() => {
    const fetchExpiringIds = async () => {
      try {
        const response = await notificationApi.getExpiring();
        setExpiringCount(response.data.length);
      } catch (error) {
        console.error('Error fetching expiring IDs:', error);
      }
    };

    fetchExpiringIds();
    // Refresh every 5 minutes
    const interval = setInterval(fetchExpiringIds, 300000);
    return () => clearInterval(interval);
  }, []);

  return (
    <AppBar position="static">
      <Toolbar>
        <Typography 
          variant="h6" 
          component="div" 
          sx={{ cursor: 'pointer', flexGrow: 1 }}
          onClick={() => navigate('/')}
        >
          ID Card System
        </Typography>

        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          {expiringCount > 0 && (
            <Button
              color="inherit"
              startIcon={<NotificationsIcon />}
              onClick={() => navigate('/notifications')}
            >
              {expiringCount}
            </Button>
          )}
          
          {admin ? (
            <Button color="inherit" onClick={logout}>
              Logout
            </Button>
          ) : (
            <Button color="inherit" onClick={() => navigate('/admin/login')}>
              Admin Login
            </Button>
          )}
        </Box>
      </Toolbar>
    </AppBar>
  );
}

export default Navbar; 