import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Container,
  Box,
  Card,
  CardContent,
  Grid,
  CircularProgress,
  Alert,
  Typography,
  IconButton,
  Fade,
  useTheme,
  Paper,
  Divider,
  Avatar,
  Button,
  Stack
} from '@mui/material';
import {
  Person as PersonIcon,
  Business as BusinessIcon,
  Badge as BadgeIcon,
  ArrowForward as ArrowForwardIcon,
  Warning as WarningIcon,
  Email as EmailIcon,
  Phone as PhoneIcon,
  LocationOn as LocationIcon,
  Login as LoginIcon,
  PictureAsPdf as PdfIcon
} from '@mui/icons-material';
import { mainPersonApi, notificationApi } from '../services/api';
import { useAuth } from '../context/AuthContext';
import ProfileMenu from '../components/ProfileMenu';

function Home() {
  const [mainPersons, setMainPersons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [stats, setStats] = useState(null);
  const navigate = useNavigate();
  const theme = useTheme();
  const { admin, logout, allowedMainPersons } = useAuth();
  const [username, setUsername] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [mainPersonsRes, expiringRes] = await Promise.all([
          mainPersonApi.getAll(),
          notificationApi.getExpiring(10)
        ]);
        
        setMainPersons(mainPersonsRes.data);
        setStats({
          totalMainPersons: mainPersonsRes.data.length,
          expiringIds: expiringRes.data.length,
          urgentExpiring: expiringRes.data.filter(id => 
            Math.ceil((new Date(id.expiryDate) - new Date()) / (1000 * 60 * 60 * 24)) <= 5
          ).length
        });
      } catch (error) {
        console.error('Error fetching data:', error);
        setError('Failed to load data. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  useEffect(() => {
    const token = localStorage.getItem('adminToken');
    if (token) {
      try {
        const decoded = JSON.parse(atob(token.split('.')[1]));
        setUsername(decoded.username);
      } catch (error) {
        console.error('Error decoding token:', error);
        setUsername('');
      }
    }
  }, []);

  const isMainPersonAllowed = (mainPersonId) => {
    return !admin || allowedMainPersons.includes(mainPersonId);
  };

  if (loading) {
    return (
      <Box 
        sx={{ 
          width: '100%',
          height: '100vh',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          bgcolor: 'background.default'
        }}
      >
        <CircularProgress size={40} />
      </Box>
    );
  }

  return (
    <Box sx={{ 
      minHeight: '100vh',
      bgcolor: 'background.default',
      display: 'flex',
      flexDirection: 'column',
      pb: 0,
      pt: 4
    }}>
      <Container maxWidth="lg">
        {error && (
          <Alert 
            severity="error" 
            sx={{ 
              mb: 4,
              borderRadius: 2,
              boxShadow: theme.shadows[2]
            }}
          >
            {error}
          </Alert>
        )}

        {stats && (
          <Fade in timeout={800}>
            <Grid container spacing={3} sx={{ mb: 4 }}>
              <Grid item xs={12} md={4}>
                <Paper 
                  elevation={0}
                  sx={{ 
                    p: 3,
                    bgcolor: 'primary.light',
                    borderRadius: 4,
                    position: 'relative',
                    overflow: 'hidden'
                  }}
                >
                  <Box 
                    sx={{ 
                      position: 'absolute',
                      top: 0,
                      right: 0,
                      p: 2,
                      opacity: 0.2
                    }}
                  >
                    <PersonIcon sx={{ fontSize: 80 }} />
                  </Box>
                  <Box display="flex" flexDirection="column" gap={1}>
                    <Typography variant="h3" fontWeight="bold" color="primary.dark">
                      {stats.totalMainPersons}
                    </Typography>
                    <Typography variant="subtitle1" color="primary.dark">
                      Main Persons
                    </Typography>
                  </Box>
                </Paper>
              </Grid>

              <Grid item xs={12} sm={4}>
                <Paper 
                  elevation={0}
                  sx={{ 
                    p: { xs: 2, sm: 3 }, 
                    bgcolor: 'warning.light',
                    borderRadius: 3,
                    position: 'relative',
                    overflow: 'hidden'
                  }}
                >
                  <Box 
                    sx={{ 
                      position: 'absolute',
                      top: 0,
                      right: 0,
                      p: 2,
                      opacity: 0.2
                    }}
                  >
                    <BadgeIcon sx={{ fontSize: 80 }} />
                  </Box>
                  <Box display="flex" flexDirection="column" gap={1}>
                    <Typography variant="h3" fontWeight="bold" color="warning.dark">
                      {stats.expiringIds}
                    </Typography>
                    <Typography variant="subtitle1" color="warning.dark">
                      Expiring IDs
                    </Typography>
                  </Box>
                </Paper>
              </Grid>

              <Grid item xs={12} sm={4}>
                <Paper 
                  elevation={0}
                  sx={{ 
                    p: { xs: 2, sm: 3 }, 
                    bgcolor: 'error.light',
                    borderRadius: 3,
                    position: 'relative',
                    overflow: 'hidden'
                  }}
                >
                  <Box 
                    sx={{ 
                      position: 'absolute',
                      top: 0,
                      right: 0,
                      p: 2,
                      opacity: 0.2
                    }}
                  >
                    <WarningIcon sx={{ fontSize: 80 }} />
                  </Box>
                  <Box display="flex" flexDirection="column" gap={1}>
                    <Typography variant="h3" fontWeight="bold" color="error.dark">
                      {stats.urgentExpiring}
                    </Typography>
                    <Typography variant="subtitle1" color="error.dark">
                      Urgent Renewals
                    </Typography>
                  </Box>
                </Paper>
              </Grid>
            </Grid>
          </Fade>
        )}

        <Fade in timeout={1000}>
          <Grid 
            container 
            spacing={3}
            sx={{ 
              position: 'relative',
              zIndex: 1,
              mb: 10
            }}
          >
            {mainPersons.map((person) => (
              <Grid item xs={12} sm={6} lg={4} key={person._id}>
                <Card 
                  onClick={() => isMainPersonAllowed(person._id) && navigate(`/main-person/${person._id}/companies`)}
                  sx={{ 
                    cursor: isMainPersonAllowed(person._id) ? 'pointer' : 'not-allowed',
                    transition: 'all 0.3s ease-in-out',
                    borderRadius: 4,
                    height: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                    opacity: isMainPersonAllowed(person._id) ? 1 : 0.6,
                    filter: isMainPersonAllowed(person._id) ? 'none' : 'grayscale(100%)',
                    '&:hover': isMainPersonAllowed(person._id) ? {
                      transform: 'translateY(-4px)',
                      boxShadow: theme.shadows[8]
                    } : {}
                  }}
                >
                  <Box 
                    sx={{ 
                      height: 8,
                      bgcolor: isMainPersonAllowed(person._id) ? 'primary.main' : 'grey.400',
                      width: '100%'
                    }} 
                  />
                  <CardContent sx={{ p: 3, flex: 1, display: 'flex', flexDirection: 'column' }}>
                    <Box display="flex" alignItems="center" gap={2} mb={2}>
                      <Avatar 
                        sx={{ 
                          bgcolor: isMainPersonAllowed(person._id) ? 'primary.light' : 'grey.300',
                          color: isMainPersonAllowed(person._id) ? 'primary.main' : 'grey.500',
                          width: 56, 
                          height: 56 
                        }}
                      >
                        <PersonIcon fontSize="large" />
                      </Avatar>
                      <Box>
                        <Typography variant="h6" fontWeight="bold">
                          {person.name}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          Main Person
                        </Typography>
                      </Box>
                    </Box>

                    <Divider sx={{ my: 2 }} />

                    <Box sx={{ pl: 1 }}>
                      <Box display="flex" alignItems="center" gap={1} mb={1.5}>
                        <EmailIcon 
                          fontSize="small" 
                          color={isMainPersonAllowed(person._id) ? "action" : "disabled"} 
                        />
                        <Typography variant="body2" color="text.secondary">
                          {person.email}
                        </Typography>
                      </Box>
                      <Box display="flex" alignItems="center" gap={1} mb={1.5}>
                        <PhoneIcon 
                          fontSize="small" 
                          color={isMainPersonAllowed(person._id) ? "action" : "disabled"} 
                        />
                        <Typography variant="body2" color="text.secondary">
                          {person.contactNumber}
                        </Typography>
                      </Box>
                      <Box display="flex" alignItems="center" gap={1}>
                        <LocationIcon 
                          fontSize="small" 
                          color={isMainPersonAllowed(person._id) ? "action" : "disabled"} 
                        />
                        <Typography variant="body2" color="text.secondary">
                          {person.address}
                        </Typography>
                      </Box>
                    </Box>

                    {isMainPersonAllowed(person._id) && (
                      <IconButton 
                        className="arrow-icon"
                        size="small"
                        sx={{ 
                          position: 'absolute',
                          right: 16,
                          bottom: 12,
                          bgcolor: 'primary.main',
                          color: 'white',
                          transition: 'all 0.3s ease',
                          '&:hover': {
                            bgcolor: 'primary.dark'
                          }
                        }}
                      >
                        <ArrowForwardIcon />
                      </IconButton>
                    )}
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        </Fade>

        <Box 
          sx={{ 
            width: '100%',
            mt: 'auto',
            py: 3,
            px: 2,
            bgcolor: 'background.paper',
            borderTopLeftRadius: 30,
            borderTopRightRadius: 30,
            boxShadow: '0px -4px 20px rgba(0, 0, 0, 0.08)',
            position: 'fixed',
            bottom: 0,
            left: 0,
            right: 0,
            zIndex: 10
          }}
        >
          <Container maxWidth="lg">
            <Stack 
              direction={{ xs: 'column', sm: 'row' }} 
              spacing={3}
              alignItems="center"
              justifyContent="center"
            >
              {admin ? (
                <ProfileMenu 
                  username={username} 
                  onLogout={logout}
                />
              ) : (
                <Button
                  variant="contained"
                  startIcon={<LoginIcon />}
                  onClick={() => navigate('/admin/login')}
                  sx={{
                    bgcolor: 'primary.main',
                    color: 'white',
                    px: 4,
                    py: 1.5,
                    borderRadius: 3,
                    minWidth: { xs: '100%', sm: 200 },
                    fontWeight: 600,
                    '&:hover': {
                      bgcolor: 'primary.dark',
                      transform: 'translateY(-2px)',
                      boxShadow: theme.shadows[4]
                    }
                  }}
                >
                  Admin Login
                </Button>
              )}
              <Button
                variant="contained"
                startIcon={<PdfIcon />}
                onClick={() => window.print()}
                sx={{
                  bgcolor: 'secondary.main',
                  color: 'white',
                  px: 4,
                  py: 1.5,
                  borderRadius: 3,
                  minWidth: { xs: '100%', sm: 200 },
                  fontWeight: 600,
                  '&:hover': {
                    bgcolor: 'secondary.dark',
                    transform: 'translateY(-2px)',
                    boxShadow: theme.shadows[4]
                  }
                }}
              >
                Print PDF
              </Button>
            </Stack>
          </Container>
        </Box>
      </Container>
    </Box>
  );
}

export default Home;