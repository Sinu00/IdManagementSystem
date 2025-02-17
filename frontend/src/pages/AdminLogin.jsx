import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Container,
  Paper,
  TextField,
  Button,
  Typography,
  Box,
  Alert,
  Avatar,
  InputAdornment,
  IconButton,
  Fade
} from '@mui/material';
import {
  Person as PersonIcon,
  Lock as LockIcon,
  Visibility as VisibilityIcon,
  VisibilityOff as VisibilityOffIcon
} from '@mui/icons-material';
import { useAuth } from '../context/AuthContext';
import { authApi } from '../services/api';

function AdminLogin() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await authApi.login({ username, password });
      login(response.data.token);
      navigate('/');
    } catch (error) {
      setError(error.response?.data?.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        height: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        bgcolor: 'background.default',
        overflow: 'hidden'
      }}
    >
      <Container maxWidth="sm" sx={{ py: 2 }}>
        <Fade in timeout={800}>
          <Paper 
            elevation={3} 
            sx={{ 
              p: { xs: 3, sm: 4 },
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              borderRadius: 3,
              maxHeight: '90vh',
              overflowY: 'auto'
            }}
          >
            <Avatar
              sx={{
                width: 48,
                height: 48,
                bgcolor: 'primary.main',
                mb: 2
              }}
            >
              <PersonIcon />
            </Avatar>

            <Typography 
              variant="h5" 
              component="h1" 
              gutterBottom 
              align="center"
              fontWeight="bold"
              color="primary"
            >
              Hello Admin
            </Typography>

            <Typography 
              variant="body2" 
              color="text.secondary" 
              align="center" 
              sx={{ mb: 3 }}
            >
              Please sign in to continue
            </Typography>

            {error && (
              <Alert severity="error" sx={{ mb: 2, width: '100%' }}>
                {error}
              </Alert>
            )}

            <form onSubmit={handleSubmit} style={{ width: '100%' }}>
              <TextField
                fullWidth
                label="Username"
                value={username}
                placeholder="Enter your username"
                onChange={(e) => setUsername(e.target.value)}
                margin="normal"
                required
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <PersonIcon color="action" />
                    </InputAdornment>
                  ),
                }}
                sx={{ mb: 2 }}
              />

              <TextField
                fullWidth
                label="Password"
                type={showPassword ? 'text' : 'password'}
                value={password}
                placeholder="Enter your password"
                onChange={(e) => setPassword(e.target.value)}
                margin="normal"
                required
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <LockIcon color="action" />
                    </InputAdornment>
                  ),
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton
                        onClick={() => setShowPassword(!showPassword)}
                        edge="end"
                      >
                        {showPassword ? <VisibilityOffIcon /> : <VisibilityIcon />}
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
                sx={{ mb: 3 }}
              />

              <Button
                fullWidth
                variant="contained"
                size="large"
                type="submit"
                disabled={loading}
                sx={{
                  py: 1.2,
                  textTransform: 'none',
                  fontSize: '1rem',
                  fontWeight: 'bold'
                }}
              >
                {loading ? 'Signing in...' : 'Sign In'}
              </Button>
            </form>
          </Paper>
        </Fade>
      </Container>
    </Box>
  );
}

export default AdminLogin; 