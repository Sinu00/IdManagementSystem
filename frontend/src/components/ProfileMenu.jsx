import { useState } from 'react';
import {
  IconButton,
  Menu,
  MenuItem,
  Avatar,
  ListItemIcon,
  ListItemText,
  Tooltip,
  Divider,
  Box,
  Typography
} from '@mui/material';
import {
  Logout as LogoutIcon,
  Person as PersonIcon
} from '@mui/icons-material';
import { useAuth } from '../context/AuthContext';

function ProfileMenu({ username, onLogout }) {
  const [anchorEl, setAnchorEl] = useState(null);
  const open = Boolean(anchorEl);
  const { user } = useAuth();

  const handleClick = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleLogout = () => {
    handleClose();
    onLogout();
  };

  return (
    <>
      <Tooltip title="Account settings">
        <IconButton
          onClick={handleClick}
          size="small"
          sx={{ 
            ml: 2,
            bgcolor: user?.isAdmin ? 'error.main' : 'primary.main',
            color: 'white',
            '&:hover': {
              bgcolor: user?.isAdmin ? 'error.dark' : 'primary.dark',
            }
          }}
        >
          <Avatar sx={{ 
            width: 32, 
            height: 32,
            bgcolor: 'inherit',
            color: 'inherit'
          }}>
            <PersonIcon />
          </Avatar>
        </IconButton>
      </Tooltip>
      <Menu
        anchorEl={anchorEl}
        id="account-menu"
        open={open}
        onClose={handleClose}
        onClick={handleClose}
        PaperProps={{
          elevation: 0,
          sx: {
            overflow: 'visible',
            filter: 'drop-shadow(0px 2px 8px rgba(0,0,0,0.32))',
            mt: 1.5,
            bgcolor: user?.isAdmin ? 'error.lighter' : 'primary.lighter',
            '& .MuiAvatar-root': {
              width: 32,
              height: 32,
              ml: -0.5,
              mr: 1,
            },
            '&:before': {
              content: '""',
              display: 'block',
              position: 'absolute',
              top: 0,
              right: 14,
              width: 10,
              height: 10,
              bgcolor: 'inherit',
              transform: 'translateY(-50%) rotate(45deg)',
              zIndex: 0,
            },
          },
        }}
        transformOrigin={{ horizontal: 'right', vertical: 'top' }}
        anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
      >
        <Box sx={{ px: 2, py: 1 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
            <PersonIcon sx={{ 
              color: user?.isAdmin ? 'error.dark' : 'primary.dark',
              fontSize: 20 
            }} />
            <Typography 
              variant="subtitle1" 
              sx={{ 
                color: user?.isAdmin ? 'error.dark' : 'primary.dark',
                fontWeight: 'bold'
              }}
            >
              {username}
            </Typography>
          </Box>
          <Typography 
            variant="caption" 
            sx={{ 
              color: user?.isAdmin ? 'error.dark' : 'primary.dark',
              opacity: 0.8,
              display: 'block',
              ml: 3.5
            }}
          >
            {user?.isAdmin ? 'Administrator' : 'Regular User'}
          </Typography>
        </Box>
        <Divider sx={{ 
          borderColor: user?.isAdmin ? 'error.main' : 'primary.main',
          opacity: 0.2
        }} />
        <MenuItem 
          onClick={handleLogout}
          sx={{
            color: user?.isAdmin ? 'error.dark' : 'primary.dark',
            '&:hover': {
              bgcolor: user?.isAdmin ? 'error.light' : 'primary.light',
            }
          }}
        >
          <ListItemIcon>
            <LogoutIcon fontSize="small" sx={{ 
              color: user?.isAdmin ? 'error.dark' : 'primary.dark' 
            }} />
          </ListItemIcon>
          <ListItemText>Logout</ListItemText>
        </MenuItem>
      </Menu>
    </>
  );
}

export default ProfileMenu; 