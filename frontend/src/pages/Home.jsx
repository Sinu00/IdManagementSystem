import { useState, useEffect, useCallback } from 'react';
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
  Stack,
  Skeleton,
  Tooltip
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
  PictureAsPdf as PdfIcon,
  Lock as LockIcon,
  AccountBalanceWallet as WalletIcon,
  MonetizationOn as MonetizationIcon
} from '@mui/icons-material';
import { mainPersonApi, notificationApi, companyApi } from '../services/api';
import { useAuth } from '../context/AuthContext';
import ProfileMenu from '../components/ProfileMenu';
import { StatCardSkeletonList } from '../components/skeletons/StatCardSkeleton';
import { CompanyCardSkeletonList } from '../components/skeletons/CompanyCardSkeleton';

function Home() {
  const [mainPersons, setMainPersons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [stats, setStats] = useState(null);
  const navigate = useNavigate();
  const theme = useTheme();
  const { user, logout } = useAuth();

  useEffect(() => {
    console.log('Current user object:', user);
  }, [user]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [mainPersonsRes, expiringRes, companiesRes] = await Promise.all([
          mainPersonApi.getAll(),
          notificationApi.getExpiring(30),
          companyApi.getStats()
        ]);
        
        setMainPersons(mainPersonsRes.data);
        setStats({
          totalMainPersons: mainPersonsRes.data.length,
          expiringIds: expiringRes.data.length,
          totalIndividuals: companiesRes.data.totalIndividuals,
          urgentExpiring: expiringRes.data.length
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

  const isMainPersonAllowed = useCallback((person) => {
    // If user is not logged in, no access
    if (!user) return false;
    
    // If user is admin with full access (Suhail)
    if (user.isAdmin && user.allowedMainPersons.includes(person._id)) {
      return true;
    }
    
    // For regular users, check if they have access to this main person
    if (!user.isAdmin && user.allowedMainPersons.includes(person._id)) {
      return true;
    }
    
    return false;
  }, [user]);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  if (error) return <Alert severity="error">{error}</Alert>;

  return (
    <Box sx={{ width: '100%', minHeight: '100vh', bgcolor: 'background.default', pt: 3}}>
      <Container maxWidth="lg">


        {/* Stats Section */}
        <Box sx={{ mt: { xs: 0, sm: 3 } }}>
          <Fade in timeout={1000}>
            <Box>
              {loading ? (
                <StatCardSkeletonList />
              ) : (
                <Grid container spacing={{ xs: 0, sm: 3 }}>
                  <Grid item xs={4} sm={4}>
                    <Paper 
                      elevation={0}
                      sx={{ 
                        p: { xs: 1.5, sm: 3 }, 
                        bgcolor: 'primary.light',
                        borderRadius: { 
                          xs: '24px 0 0 24px',
                          sm: 3 
                        },
                        position: 'relative',
                        overflow: 'hidden',
                        height: '100%'
                      }}
                    >
                      <Box 
                        sx={{ 
                          position: 'absolute',
                          top: 0,
                          right: 0,
                          p: { xs: 1, sm: 2 },
                          opacity: 0.2
                        }}
                      >
                        <PersonIcon sx={{ fontSize: { xs: 32, sm: 80 } }} />
                      </Box>
                      <Box display="flex" flexDirection="column" gap={0.5}>
                        <Typography 
                          variant="h3" 
                          fontWeight="bold" 
                          color="primary.dark"
                          sx={{ 
                            fontSize: { xs: '1.25rem', sm: '2.5rem' }
                          }}
                        >
                          {stats?.totalMainPersons || <Skeleton width={100} />}
                        </Typography>
                        <Typography 
                          variant="subtitle2" 
                          color="primary.dark"
                          sx={{ 
                            fontSize: { xs: '0.7rem', sm: '1rem' }
                          }}
                        >
                          Main Persons
                        </Typography>
                      </Box>
                    </Paper>
                  </Grid>

                  <Grid item xs={4} sm={4}>
                    <Paper 
                      elevation={0}
                      sx={{ 
                        p: { xs: 1.5, sm: 3 }, 
                        bgcolor: 'warning.light',
                        borderRadius: { 
                          xs: 0,
                          sm: 3 
                        },
                        position: 'relative',
                        overflow: 'hidden',
                        height: '100%'
                      }}
                    >
                      <Box 
                        sx={{ 
                          position: 'absolute',
                          top: 0,
                          right: 0,
                          p: { xs: 1, sm: 2 },
                          opacity: 0.2
                        }}
                      >
                        <BadgeIcon sx={{ fontSize: { xs: 32, sm: 80 } }} />
                      </Box>
                      <Box display="flex" flexDirection="column" gap={0.5}>
                        <Typography 
                          variant="h3" 
                          fontWeight="bold" 
                          color="warning.dark"
                          sx={{ 
                            fontSize: { xs: '1.25rem', sm: '2.5rem' }
                          }}
                        >
                          {stats?.totalIndividuals || <Skeleton width={100} />}
                        </Typography>
                        <Typography 
                          variant="subtitle2" 
                          color="warning.dark"
                          sx={{ 
                            fontSize: { xs: '0.7rem', sm: '1rem' }
                          }}
                        >
                          Total IDs
                        </Typography>
                      </Box>
                    </Paper>
                  </Grid>

                  <Grid item xs={4} sm={4}>
                    <Paper 
                      elevation={0}
                      sx={{ 
                        p: { xs: 1.5, sm: 3 }, 
                        bgcolor: 'error.light',
                        borderRadius: { 
                          xs: '0 24px 24px 0',
                          sm: 3 
                        },
                        position: 'relative',
                        overflow: 'hidden',
                        height: '100%'
                      }}
                    >
                      <Box 
                        sx={{ 
                          position: 'absolute',
                          top: 0,
                          right: 0,
                          p: { xs: 1, sm: 2 },
                          opacity: 0.2
                        }}
                      >
                        <WarningIcon sx={{ fontSize: { xs: 32, sm: 80 } }} />
                      </Box>
                      <Box display="flex" flexDirection="column" gap={0.5}>
                        <Typography 
                          variant="h3" 
                          fontWeight="bold" 
                          color="error.dark"
                          sx={{ 
                            fontSize: { xs: '1.25rem', sm: '2.5rem' }
                          }}
                        >
                          {stats?.urgentExpiring || <Skeleton width={100} />}
                        </Typography>
                        <Typography 
                          variant="subtitle2" 
                          color="error.dark"
                          sx={{ 
                            fontSize: { xs: '0.7rem', sm: '1rem' }
                          }}
                        >
                          Urgent
                        </Typography>
                      </Box>
                    </Paper>
                  </Grid>
                </Grid>
              )}
            </Box>
          </Fade>
        </Box>

        {/* Main Persons List */}
        <Box sx={{ mt: 4 }}>
          <Fade in timeout={1200}>
            <Box>
              {loading ? (
                <CompanyCardSkeletonList count={3} />
              ) : (
                <Grid container spacing={3}>
                  {mainPersons.map((person, index) => {
                    const isAllowed = isMainPersonAllowed(person);
                    const isLastItem = index === mainPersons.length - 1;

                    return (
                      <Grid 
                        item 
                        xs={12} 
                        sm={6} 
                        md={4} 
                        key={person._id}
                        sx={{
                          mb: { xs: isLastItem ? 15 : 0, sm: 0 }
                        }}
                      >
                        <Card 
                          onClick={() => isAllowed && navigate(`/main-person/${person._id}/companies`)}
                          sx={{ 
                            cursor: isAllowed ? 'pointer' : 'not-allowed',
                            transition: 'all 0.3s ease-in-out',
                            borderRadius: 4,
                            height: '100%',
                            display: 'flex',
                            flexDirection: 'column',
                            opacity: isAllowed ? 1 : 0.5,
                            filter: isAllowed ? 'none' : 'grayscale(100%)',
                            position: 'relative',
                            '@media (hover: hover)': {
                              '&:hover': isAllowed ? {
                                transform: 'translateY(-4px)',
                                boxShadow: theme.shadows[8],
                                '& .arrow-icon': {
                                  opacity: 1,
                                  transform: 'translateX(0)'
                                }
                              } : {}
                            },
                            '&::after': !isAllowed ? {
                              content: '""',
                              position: 'absolute',
                              top: 0,
                              left: 0,
                              right: 0,
                              bottom: 0,
                              backgroundColor: 'rgba(0, 0, 0, 0.1)',
                              zIndex: 1
                            } : undefined
                          }}
                        >
                          {!isAllowed && (
                            <LockIcon 
                              sx={{ 
                                position: 'absolute',
                                top: '50%',
                                left: '50%',
                                transform: 'translate(-50%, -50%)',
                                color: 'text.disabled',
                                fontSize: 40,
                                zIndex: 2
                              }} 
                            />
                          )}

                          <Box 
                            sx={{ 
                              height: 8,
                              bgcolor: isAllowed ? 'primary.main' : 'grey.400',
                              width: '100%'
                            }} 
                          />
                          
                          <CardContent sx={{ p: 3, flex: 1 }}>
                            <Box display="flex" alignItems="center" gap={2} mb={2}>
                              <Avatar 
                                sx={{ 
                                  bgcolor: isAllowed ? 'primary.light' : 'grey.300',
                                  color: isAllowed ? 'primary.main' : 'grey.500',
                                  width: 56, 
                                  height: 56 
                                }}
                              >
                                <PersonIcon fontSize="large" />
                              </Avatar>
                              <Box>
                                <Typography 
                                  variant="h6" 
                                  fontWeight="bold"
                                  color={isAllowed ? 'text.primary' : 'text.disabled'}
                                >
                                  {person.name}
                                </Typography>
                                <Typography 
                                  variant="body2" 
                                  color={isAllowed ? 'text.secondary' : 'text.disabled'}
                                >
                                  Main Person
                                </Typography>
                              </Box>
                            </Box>

                            <Divider sx={{ my: 2 }} />

                            <Box sx={{ pl: 1 }}>
                              <Box display="flex" alignItems="center" gap={1} mb={1.5}>
                                <EmailIcon 
                                  fontSize="small" 
                                  color={isAllowed ? "primary" : "disabled"} 
                                />
                                <Typography 
                                  variant="body2" 
                                  color={isAllowed ? 'text.secondary' : 'text.disabled'}
                                >
                                  {person.email}
                                </Typography>
                              </Box>
                              <Box display="flex" alignItems="center" gap={1}>
                                <PhoneIcon 
                                  fontSize="small" 
                                  color={isAllowed ? "primary" : "disabled"} 
                                />
                                <Typography 
                                  variant="body2" 
                                  color={isAllowed ? 'text.secondary' : 'text.disabled'}
                                >
                                  {person.contactNumber}
                                </Typography>
                              </Box>
                            </Box>

                            {isAllowed && (
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
                                  opacity: 0,
                                  transform: 'translateX(-10px)',
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
                    );
                  })}
                </Grid>
              )}
            </Box>
          </Fade>
        </Box>
      </Container>

      {/* Bottom Toolbar */}
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
            direction="row" 
            spacing={3}
            alignItems="center"
            justifyContent="center"
          >
            <ProfileMenu 
              username={user?.username} 
              onLogout={handleLogout}
            />
            <Tooltip title="Print PDF">
              <IconButton
                onClick={() => window.print()}
                size="small"
                sx={{ 
                  bgcolor: 'secondary.main',
                  color: 'white',
                  '&:hover': {
                    bgcolor: 'secondary.dark',
                  }
                }}
              >
                <Avatar 
                  sx={{ 
                    width: 32, 
                    height: 32,
                    bgcolor: 'inherit',
                    color: 'inherit'
                  }}
                >
                  <PdfIcon />
                </Avatar>
              </IconButton>
            </Tooltip>

            {Boolean(user?.hasIncomeAccess) && (
              <Tooltip title="Income & Expense">
                <IconButton
                  onClick={() => navigate('/income-expense')}
                  size="small"
                  sx={{ 
                    bgcolor: 'success.main',
                    color: 'white',
                    '&:hover': {
                      bgcolor: 'success.dark',
                    }
                  }}
                >
                  <Avatar 
                    sx={{ 
                      width: 32, 
                      height: 32,
                      bgcolor: 'inherit',
                      color: 'inherit'
                    }}
                  >
                    <WalletIcon />
                  </Avatar>
                </IconButton>
              </Tooltip>
            )}
          </Stack>
        </Container>
      </Box>
    </Box>
  );
}

export default Home;