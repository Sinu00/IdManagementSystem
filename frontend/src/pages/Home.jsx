import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Container,
  Box,
  Typography,
  Card,
  CardContent,
  Grid,
  CircularProgress,
  Alert,
  Paper,
  IconButton,
  Fade,
  useTheme,
  Divider
} from '@mui/material';
import {
  Person as PersonIcon,
  Business as BusinessIcon,
  Badge as BadgeIcon,
  ArrowForward as ArrowForwardIcon,
  Warning as WarningIcon,
  Email as EmailIcon,
  Phone as PhoneIcon
} from '@mui/icons-material';
import { mainPersonApi, notificationApi } from '../services/api';
import { useAuth } from '../context/AuthContext';

function Home() {
  const [mainPersons, setMainPersons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [stats, setStats] = useState(null);
  const navigate = useNavigate();
  const { admin } = useAuth();
  const theme = useTheme();

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

  if (loading) {
    return (
      <Box 
        sx={{ 
          width: '100%',
          minHeight: '100vh',
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
    <Box 
      sx={{ 
        width: '100%',
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        bgcolor: 'background.default',
        py: 6
      }}
    >
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
            <Grid container spacing={3} sx={{ mb: 6 }}>
              <Grid item xs={12} md={4}>
                <Paper 
                  elevation={0}
                  sx={{ 
                    p: 3, 
                    bgcolor: 'primary.main',
                    color: 'primary.contrastText',
                    borderRadius: 3,
                    transition: 'transform 0.2s',
                    '&:hover': {
                      transform: 'translateY(-4px)'
                    }
                  }}
                >
                  <Box display="flex" alignItems="center" gap={2}>
                    <PersonIcon fontSize="large" />
                    <Box>
                      <Typography variant="h3" fontWeight="bold">
                        {stats.totalMainPersons}
                      </Typography>
                      <Typography variant="body1">Main Persons</Typography>
                    </Box>
                  </Box>
                </Paper>
              </Grid>
              <Grid item xs={12} md={4}>
                <Paper 
                  elevation={0}
                  sx={{ 
                    p: 3, 
                    bgcolor: 'warning.main',
                    color: 'warning.contrastText',
                    borderRadius: 3,
                    transition: 'transform 0.2s',
                    '&:hover': {
                      transform: 'translateY(-4px)'
                    }
                  }}
                >
                  <Box display="flex" alignItems="center" gap={2}>
                    <BadgeIcon fontSize="large" />
                    <Box>
                      <Typography variant="h3" fontWeight="bold">
                        {stats.expiringIds}
                      </Typography>
                      <Typography variant="body1">Expiring IDs</Typography>
                    </Box>
                  </Box>
                </Paper>
              </Grid>
              <Grid item xs={12} md={4}>
                <Paper 
                  elevation={0}
                  sx={{ 
                    p: 3, 
                    bgcolor: 'error.main',
                    color: 'error.contrastText',
                    borderRadius: 3,
                    transition: 'transform 0.2s',
                    '&:hover': {
                      transform: 'translateY(-4px)'
                    }
                  }}
                >
                  <Box display="flex" alignItems="center" gap={2}>
                    <WarningIcon fontSize="large" />
                    <Box>
                      <Typography variant="h3" fontWeight="bold">
                        {stats.urgentExpiring}
                      </Typography>
                      <Typography variant="body1">Urgent Renewals</Typography>
                    </Box>
                  </Box>
                </Paper>
              </Grid>
            </Grid>
          </Fade>
        )}

        <Fade in timeout={1000}>
          <Grid container spacing={3}>
            {mainPersons.map((person) => (
              <Grid item xs={12} sm={6} md={4} key={person._id}>
                <Card 
                  onClick={() => navigate(`/main-person/${person._id}/companies`)}
                  sx={{ 
                    cursor: 'pointer',
                    transition: 'all 0.3s ease-in-out',
                    borderRadius: 3,
                    overflow: 'hidden',
                    position: 'relative',
                    '&:hover': {
                      transform: 'translateY(-4px)',
                      boxShadow: theme.shadows[8],
                      '& .arrow-icon': {
                        transform: 'translateX(4px)'
                      }
                    }
                  }}
                >
                  <Box 
                    sx={{ 
                      height: 8, 
                      bgcolor: 'primary.main',
                      width: '100%'
                    }} 
                  />
                  <CardContent sx={{ p: 3 }}>
                    <Box display="flex" alignItems="center" gap={2} mb={2}>
                      <BusinessIcon color="primary" fontSize="large" />
                      <Typography variant="h6" fontWeight="bold">
                        {person.name}
                      </Typography>
                    </Box>
                    <Divider sx={{ my: 2 }} />
                    <Box sx={{ pl: 1 }}>
                      <Box display="flex" alignItems="center" gap={1} mb={1}>
                        <EmailIcon fontSize="small" color="action" />
                        <Typography variant="body2" color="text.secondary">
                          {person.email}
                        </Typography>
                      </Box>
                      <Box display="flex" alignItems="center" gap={1}>
                        <PhoneIcon fontSize="small" color="action" />
                        <Typography variant="body2" color="text.secondary">
                          {person.contactNumber}
                        </Typography>
                      </Box>
                    </Box>
                    <IconButton 
                      className="arrow-icon"
                      size="small"
                      sx={{ 
                        position: 'absolute',
                        right: 16,
                        bottom: 16,
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
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        </Fade>
      </Container>
    </Box>
  );
}

export default Home; 