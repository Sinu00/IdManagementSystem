import { useState } from 'react';
import {
  Box,
  IconButton,
  Menu,
  MenuItem,
  Typography,
  Avatar,
  Divider
} from '@mui/material';
import { Person as PersonIcon } from '@mui/icons-material';

function ProfileMenu({ username, onLogout }) {
  const [anchorEl, setAnchorEl] = useState(null);
  const open = Boolean(anchorEl);

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
    <Box>
      <IconButton
        onClick={handleClick}
        size="small"
        sx={{ ml: 2 }}
        aria-controls={open ? 'profile-menu' : undefined}
        aria-haspopup="true"
        aria-expanded={open ? 'true' : undefined}
      >
        <Avatar sx={{ width: 32, height: 32, bgcolor: 'primary.main' }}>
          <PersonIcon />
        </Avatar>
      </IconButton>
      <Menu
        anchorEl={anchorEl}
        id="profile-menu"
        open={open}
        onClose={handleClose}
        onClick={handleClose}
        transformOrigin={{ horizontal: 'right', vertical: 'top' }}
        anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
      >
        <Box sx={{ px: 2, py: 1 }}>
          <Typography variant="subtitle1" color="primary.main">
            {username}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            Administrator
          </Typography>
        </Box>
        <Divider />
        <MenuItem onClick={handleLogout} sx={{ color: 'error.main' }}>
          Logout
        </MenuItem>
      </Menu>
    </Box>
  );
}

export default ProfileMenu; 