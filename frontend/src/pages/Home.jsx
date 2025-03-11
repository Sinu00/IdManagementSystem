import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
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
  Tooltip,
  Badge
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
  MonetizationOn as MonetizationIcon,
  NotificationsActive as NotificationsIcon,
  AttachMoney as MoneyIcon,
} from '@mui/icons-material';
import { mainPersonApi, notificationApi, companyApi, notifyAdminApi, notifyCompanyAdminApi } from '../services/api';
import { useAuth } from '../context/AuthContext';
import ProfileMenu from '../components/ProfileMenu';
import LanguageSwitcher from '../components/common/LanguageSwitcher';
import { StatCardSkeletonList } from '../components/skeletons/StatCardSkeleton';
import { CompanyCardSkeletonList } from '../components/skeletons/CompanyCardSkeleton';
import axios from 'axios';
import { startOfMonth, endOfMonth, subMonths } from 'date-fns';
import { nasserApi } from '../services/api';

function Home() {
  const { t } = useTranslation();
  const [mainPersons, setMainPersons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [stats, setStats] = useState(null);
  const [notificationCount, setNotificationCount] = useState(0);
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
        const promises = [
          mainPersonApi.getAll(),
          notificationApi.getExpiring(30),
          companyApi.getStats(),
        ];

        // Only fetch admin notifications if user is admin
        if (user.isAdmin) {
          promises.push(Promise.all([
            notifyAdminApi.getAll(),
            notifyCompanyAdminApi.getAll()
          ]));
        }

        const responses = await Promise.all(promises);
        const [mainPersonsRes, expiringRes, companiesRes, ...rest] = responses;
        
        setMainPersons(mainPersonsRes.data);
        setStats({
          totalMainPersons: mainPersonsRes.data.length,
          expiringIds: expiringRes.data.length,
          totalIndividuals: companiesRes.data.totalIndividuals,
          urgentExpiring: expiringRes.data.length
        });

        // Calculate total notifications only if user is admin
        if (user.isAdmin && rest.length > 0) {
          const notificationsRes = rest[0];
          const totalNotifications = (
            Array.isArray(notificationsRes[0].data) ? notificationsRes[0].data.length : 0
          ) + (
            Array.isArray(notificationsRes[1].data) ? notificationsRes[1].data.length : 0
          );
          setNotificationCount(totalNotifications);
        }
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
        {/* Stats Section - Show cards immediately with skeletons only for numbers */}
        <Box sx={{ mt: { xs: 0, sm: 3 } }}>
          <Fade in timeout={1000}>
            <Box>
              <Grid container spacing={{ xs: 0, sm: 3 }}>
                <Grid item xs={4} sm={4}>
                  <Paper 
                    elevation={0}
                    sx={{ 
                      p: { xs: 1.5, sm: 3 }, 
                      bgcolor: 'primary.light',
                      borderRadius: { 
                        xs: '10px 0 0 10px',
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
                      {loading ? (
                        <Skeleton 
                          variant="text" 
                          width={100} 
                          sx={{ 
                            fontSize: { xs: '1.25rem', sm: '2.5rem' },
                            height: { xs: '30px', sm: '60px' }
                          }}
                        />
                      ) : (
                        <Typography 
                          variant="h3" 
                          fontWeight="bold" 
                          color="primary.dark"
                          sx={{ 
                            fontSize: { xs: '1.25rem', sm: '2.5rem' }
                          }}
                        >
                          {stats?.totalMainPersons}
                        </Typography>
                      )}
                      <Typography 
                        variant="subtitle2" 
                        color="primary.dark"
                        sx={{ 
                          fontSize: { xs: '0.7rem', sm: '1rem' }
                        }}
                      >
                        {t('home.sponsors')}
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
                      {loading ? (
                        <Skeleton 
                          variant="text" 
                          width={100} 
                          sx={{ 
                            fontSize: { xs: '1.25rem', sm: '2.5rem' },
                            height: { xs: '30px', sm: '60px' }
                          }}
                        />
                      ) : (
                        <Typography 
                          variant="h3" 
                          fontWeight="bold" 
                          color="warning.dark"
                          sx={{ 
                            fontSize: { xs: '1.25rem', sm: '2.5rem' }
                          }}
                        >
                          {stats?.totalIndividuals}
                        </Typography>
                      )}
                      <Typography 
                        variant="subtitle2" 
                        color="warning.dark"
                        sx={{ 
                          fontSize: { xs: '0.7rem', sm: '1rem' }
                        }}
                      >
                        {t('home.totalIds')}
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
                        xs: '0 10px 10px 0',
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
                      {loading ? (
                        <Skeleton 
                          variant="text" 
                          width={100} 
                          sx={{ 
                            fontSize: { xs: '1.25rem', sm: '2.5rem' },
                            height: { xs: '30px', sm: '60px' }
                          }}
                        />
                      ) : (
                        <Typography 
                          variant="h3" 
                          fontWeight="bold" 
                          color="error.dark"
                          sx={{ 
                            fontSize: { xs: '1.25rem', sm: '2.5rem' }
                          }}
                        >
                          {stats?.urgentExpiring}
                        </Typography>
                      )}
                      <Typography 
                        variant="subtitle2" 
                        color="error.dark"
                        sx={{ 
                          fontSize: { xs: '0.7rem', sm: '1rem' }
                        }}
                      >
                        {t('home.expiringSoon')}
                      </Typography>
                    </Box>
                  </Paper>
                </Grid>
              </Grid>
            </Box>
          </Fade>
        </Box>

        {/* Main Persons List */}
        <Box sx={{ mt: 4 }}>
          <Fade in timeout={1200}>
            <Box>
              <Grid container spacing={3}>
                {loading ? (
                  // Show placeholder cards while loading
                  [...Array(3)].map((_, index) => (
                    <Grid 
                      item 
                      xs={12} 
                      sm={6} 
                      md={4} 
                      key={index}
                      sx={{
                        mb: { xs: index === 2 ? 15 : 0, sm: 0 }
                      }}
                    >
                      <Card 
                        sx={{ 
                          borderRadius: 4,
                          height: '100%',
                          display: 'flex',
                          flexDirection: 'column',
                          position: 'relative',
                          opacity: 0.7
                        }}
                      >
                        <Box 
                          sx={{ 
                            height: 8,
                            bgcolor: 'grey.300',
                            width: '100%'
                          }} 
                        />
                        
                        <CardContent sx={{ p: 3, flex: 1 }}>
                          <Box display="flex" alignItems="center" gap={2} mb={2}>
                            <Avatar 
                              sx={{ 
                                bgcolor: 'grey.200',
                                width: 56, 
                                height: 56 
                              }}
                            >
                              <PersonIcon fontSize="large" sx={{ color: 'grey.400' }} />
                            </Avatar>
                            <Box>
                              <Skeleton 
                                variant="text" 
                                width={150} 
                                sx={{ height: '28px' }}
                              />
                              <Skeleton 
                                variant="text" 
                                width={100} 
                                sx={{ height: '20px' }}
                              />
                            </Box>
                          </Box>

                          <Divider sx={{ my: 2 }} />

                          <Box sx={{ pl: 1 }}>
                            <Box display="flex" alignItems="center" gap={1} mb={1.5}>
                              <EmailIcon 
                                fontSize="small" 
                                sx={{ color: 'grey.400' }}
                              />
                              <Skeleton 
                                variant="text" 
                                width={180} 
                                sx={{ height: '20px' }}
                              />
                            </Box>
                            <Box display="flex" alignItems="center" gap={1}>
                              <PhoneIcon 
                                fontSize="small" 
                                sx={{ color: 'grey.400' }}
                              />
                              <Skeleton 
                                variant="text" 
                                width={140} 
                                sx={{ height: '20px' }}
                              />
                            </Box>
                          </Box>
                        </CardContent>
                      </Card>
                    </Grid>
                  ))
                ) : (
                  // Show actual data when loaded
                  mainPersons.map((person, index) => {
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
                                  Sponsors
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
                                  <span className={person.contactNumber ? '' : 'no-link'}>{person.contactNumber}</span>
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
                  })
                )}
              </Grid>
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
            <Tooltip title={t('home.printPdf')}>
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

            {user?.hasIncomeAccess?.includes('company') && (
              <Tooltip title={t('home.incomeAndExpense')}>
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

            {user?.hasIncomeAccess?.includes('nasser') && (
              <Tooltip title="Nasser Income & Expense">
                <IconButton
                  onClick={() => navigate('/nasser-income-expense')}
                  size="small"
                  sx={{ 
                    bgcolor: 'info.main',
                    color: 'white',
                    '&:hover': {
                      bgcolor: 'info.dark',
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
                    <MoneyIcon />
                  </Avatar>
                </IconButton>
              </Tooltip>
            )}

            {user?.isAdmin && (
              <Tooltip title="Bulk Data Migration">
                <IconButton
                  onClick={() => navigate('/bulk-migration')}
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
                    <BusinessIcon />
                  </Avatar>
                </IconButton>
              </Tooltip>
            )}

            <LanguageSwitcher />

            {user?.isAdmin && (
              <Tooltip title={t('home.adminNotifications')}>
                <IconButton
                  onClick={() => navigate('/admin-notifications')}
                  size="small"
                  sx={{ 
                    bgcolor: 'warning.main',
                    color: 'white',
                    '&:hover': {
                      bgcolor: 'warning.dark',
                    }
                  }}
                >
                  <Badge 
                    badgeContent={loading ? (
                      <Skeleton 
                        variant="circular" 
                        width={16} 
                        height={16} 
                        sx={{ bgcolor: 'warning.main' }} 
                      />
                    ) : notificationCount}
                    color="error"
                    sx={{
                      '& .MuiBadge-badge': {
                        right: -3,
                        top: 3,
                        border: '2px solid #fff',
                        padding: '0 4px',
                      }
                    }}
                  >
                    <Avatar sx={{ width: 32, height: 32, bgcolor: 'inherit', color: 'inherit' }}>
                      <NotificationsIcon />
                    </Avatar>
                  </Badge>
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