import React, { useEffect, useState } from 'react';
import { 
  Box, 
  Typography, 
  Card, 
  CardContent, 
  Button, 
  CircularProgress, 
  Grid, 
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Container,
  Fade,
  Avatar,
  IconButton,
  Stack,
  Tooltip,
  Tabs,
  Tab,
  Skeleton,
  Badge
} from '@mui/material';
import {
  Check as CheckIcon,
  Close as CloseIcon,
  NotificationsActive as NotificationsIcon,
  Person as PersonIcon,
  Badge as BadgeIcon,
  CalendarToday as CalendarIcon,
  AccountCircle as AccountCircleIcon,
  Add as AddIcon,
  Autorenew as RenewIcon,
  MonetizationOn as PaymentIcon,
  Business as BusinessIcon,
  Refresh as RefreshIcon
} from '@mui/icons-material';
import { format } from 'date-fns';
import { notifyAdminApi, notifyCompanyAdminApi } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { useTranslation } from 'react-i18next';

function TabPanel(props) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`notification-tabpanel-${index}`}
      aria-labelledby={`notification-tab-${index}`}
      {...other}
    >
      {value === index && (
        <Box>
          {children}
        </Box>
      )}
    </div>
  );
}

const renderSkeletonRow = (index) => (
  <TableRow key={`loading-row-${index}`}>
    <TableCell><Skeleton variant="rounded" width={100} height={24} /></TableCell>
    <TableCell>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <Skeleton variant="circular" width={24} height={24} />
        <Skeleton variant="text" width={100} />
      </Box>
    </TableCell>
    <TableCell>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <Skeleton variant="circular" width={32} height={32} />
        <Box>
          <Skeleton variant="text" width={120} />
          <Skeleton variant="text" width={80} />
        </Box>
      </Box>
    </TableCell>
    <TableCell>
      <Stack spacing={0.5}>
        <Skeleton variant="text" width={150} />
        <Skeleton variant="text" width={130} />
      </Stack>
    </TableCell>
    <TableCell><Skeleton variant="text" width={80} /></TableCell>
    <TableCell><Skeleton variant="text" width={90} /></TableCell>
    <TableCell align="right">
      <Stack direction="row" spacing={1} justifyContent="flex-end">
        <Skeleton variant="circular" width={32} height={32} />
        <Skeleton variant="circular" width={32} height={32} />
      </Stack>
    </TableCell>
  </TableRow>
);

const renderLoadingTable = () => (
  <TableContainer component={Paper} sx={{ borderRadius: 3, boxShadow: 2 }}>
    <Table>
      <TableHead>
        <TableRow>
          <TableCell>Type</TableCell>
          <TableCell>Requested By</TableCell>
          <TableCell>Individual/Company</TableCell>
          <TableCell>Details</TableCell>
          <TableCell>Amount</TableCell>
          <TableCell>Date</TableCell>
          <TableCell align="right">Actions</TableCell>
        </TableRow>
      </TableHead>
      <TableBody>
        {[...Array(5)].map((_, index) => renderSkeletonRow(index))}
      </TableBody>
    </Table>
  </TableContainer>
);

function AdminNotifications() {
  const { t } = useTranslation();
  const [individualNotifications, setIndividualNotifications] = useState([]);
  const [companyNotifications, setCompanyNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [tabValue, setTabValue] = useState(0);
  const [selectedNotification, setSelectedNotification] = useState(null);
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);
  const [dialogAction, setDialogAction] = useState('');
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  // Redirect if user is not admin
  useEffect(() => {
    if (!user?.isAdmin) {
      navigate('/');
    }
  }, [user, navigate]);

  const fetchNotifications = async () => {
    try {
      setRefreshing(true);
      const config = {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      };
      
      const [individualRes, companyRes] = await Promise.all([
        notifyAdminApi.getAll(),
        notifyCompanyAdminApi.getAll()
      ]);

      console.log('Raw company notifications:', companyRes.data);

      // For company notifications, if it's a payment request, get the details from originalCompany
      const processedCompanyNotifications = companyRes.data.map(notification => {
        if (notification.requestType === 'PAYMENT') {
          const originalCompany = notification.originalCompany;
          console.log('Original company data:', originalCompany);
          
          return {
            ...notification,
            crNumber: originalCompany?.crNumber || '-',
            sponserId: originalCompany?.sponserId || '-',
            gosiNumber: originalCompany?.gosiNumber || '-',
            molNumber: originalCompany?.molNumber || '-'
          };
        }
        return notification;
      });

      console.log('Processed notifications:', processedCompanyNotifications);
      
      setIndividualNotifications(Array.isArray(individualRes.data) ? individualRes.data : []);
      setCompanyNotifications(Array.isArray(processedCompanyNotifications) ? processedCompanyNotifications : []);
    } catch (error) {
      console.error('Error fetching notifications:', error);
      setError('Failed to load notifications');
      
      if (error.response?.status === 401) {
        logout();
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // Initial fetch
  useEffect(() => {
    fetchNotifications();
  }, [logout]);

  const handleRefresh = async () => {
    await fetchNotifications();
  };

  const handleApprove = (notification, type) => {
    setSelectedNotification({ ...notification, type });
    setDialogAction('approve');
    setConfirmDialogOpen(true);
  };

  const handleReject = (notification, type) => {
    setSelectedNotification({ ...notification, type });
    setDialogAction('reject');
    setConfirmDialogOpen(true);
  };

  const handleConfirmAction = async () => {
    try {
      const notificationId = selectedNotification._id;
      
      if (dialogAction === 'approve') {
        if (selectedNotification.type === 'company') {
          await notifyCompanyAdminApi.approve(notificationId);
        } else {
          await notifyAdminApi.approve(notificationId);
        }
        
        toast.success(t(`adminNotifications.toast.${selectedNotification.type}RequestApproved`));
      } else {
        if (selectedNotification.type === 'company') {
          await notifyCompanyAdminApi.reject(notificationId);
        } else {
          await notifyAdminApi.reject(notificationId);
        }
        
        toast.success(t(`adminNotifications.toast.${selectedNotification.type}RequestRejected`));
      }

      setConfirmDialogOpen(false);
      fetchNotifications();
    } catch (error) {
      console.error('Error processing notification:', error);
      toast.error(t('adminNotifications.toast.processingError'));
    }
  };

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };

  const formatDate = (date) => {
    return format(new Date(date), 'dd MMM yyyy');
  };

  const getRequestTypeChip = (requestType, paymentType) => {
    let color;
    let icon;
    let label;

    // If it's a payment request, combine the payment type
    if (requestType === 'PAYMENT' && paymentType) {
      label = t(`adminNotifications.paymentTypes.${paymentType.toLowerCase()}`);
      color = 'warning';
      icon = <PaymentIcon />;
    } else {
      label = t(`adminNotifications.requestTypes.${requestType}`);
      switch (requestType) {
        case 'ADD':
          color = 'primary';
          icon = <AddIcon />;
          break;
        case 'RENEW':
          color = 'success';
          icon = <RenewIcon />;
          break;
        default:
          color = 'default';
          icon = <NotificationsIcon />;
      }
    }

    return (
      <Chip
        icon={icon}
        label={label}
        color={color}
        size="small"
        sx={{ 
          '& .MuiChip-icon': { fontSize: 16 },
          fontWeight: 'medium',
          fontSize: '0.75rem'
        }}
      />
    );
  };

  const renderNotificationsTable = (notifications, type) => {
    if (loading) {
      return renderLoadingTable();
    }

    if (notifications.length === 0) {
      return (
        <Paper sx={{ p: 4, textAlign: 'center', borderRadius: 3 }}>
          <NotificationsIcon sx={{ fontSize: 64, color: 'text.disabled', mb: 2 }} />
          <Typography variant="h6" color="text.secondary">
            {t('adminNotifications.noResults.title')}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {t(`adminNotifications.noResults.${type}`)}
          </Typography>
        </Paper>
      );
    }

    return (
      <TableContainer component={Paper} sx={{ borderRadius: 3, boxShadow: 2 }}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>{t('adminNotifications.table.type')}</TableCell>
              <TableCell>{t('adminNotifications.table.requestedBy')}</TableCell>
              <TableCell>{t(`adminNotifications.table.${type}`)}</TableCell>
              <TableCell>{t('adminNotifications.table.details')}</TableCell>
              <TableCell>{t('adminNotifications.table.amount')}</TableCell>
              <TableCell>{t('adminNotifications.table.date')}</TableCell>
              <TableCell align="right">{t('adminNotifications.table.actions')}</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {notifications.map((notification) => (
              <TableRow 
                key={notification._id}
                sx={{ 
                  '&:last-child td, &:last-child th': { border: 0 },
                  transition: 'background-color 0.2s',
                  '&:hover': {
                    backgroundColor: 'action.hover'
                  }
                }}
              >
                <TableCell>
                  {getRequestTypeChip(notification.requestType, notification.paymentType)}
                </TableCell>
                <TableCell>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Avatar 
                      sx={{ 
                        width: 24, 
                        height: 24,
                        bgcolor: '#e3f2fd',
                        color: '#1976d2'
                      }}
                    >
                      <PersonIcon sx={{ fontSize: 16 }} />
                    </Avatar>
                    <Typography variant="body2">
                      {(notification.addedBy?.username?.charAt(0).toUpperCase() + notification.addedBy?.username?.slice(1)) || 'Unknown'}
                    </Typography>
                  </Box>
                </TableCell>
                <TableCell>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Avatar 
                      sx={{ 
                        width: 32, 
                        height: 32,
                        bgcolor: '#e3f2fd',
                        color: '#1976d2'
                      }}
                    >
                      {type === 'individual' ? (
                        notification.name?.charAt(0).toUpperCase()
                      ) : (
                        <BusinessIcon sx={{ fontSize: 20 }} />
                      )}
                    </Avatar>
                    <Box>
                      <Typography 
                        variant="subtitle2"
                        sx={{ 
                          direction: type === 'individual' ? 'ltr' : 'rtl',
                          textAlign: type === 'individual' ? 'left' : 'right',
                          fontFamily: type === 'individual' ? 'inherit' : 'Noto Sans Arabic, Arial, sans-serif',
                          fontSize: '0.875rem'
                        }}
                      >
                        {type === 'individual' 
                          ? notification.name?.split(' ').map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()).join(' ')
                          : notification.name}
                      </Typography>
                      <Typography 
                        variant="caption" 
                        color="text.secondary"
                        sx={{
                          display: 'block',
                          direction: 'ltr',
                          textAlign: 'left'
                        }}
                      >
                        {type === 'individual' ? notification.nationality : notification.email}
                      </Typography>
                    </Box>
                  </Box>
                </TableCell>
                <TableCell>
                  <Stack spacing={0.5}>
                    {type === 'individual' ? (
                      <>
                        <Typography variant="body2" sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                          <BadgeIcon sx={{ fontSize: 16, color: 'primary.main' }} />
                          {t('adminNotifications.details.iqama')}: {notification.iqamaNumber}
                        </Typography>
                        {notification.company?.name && (
                          <Typography variant="body2" sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                            <BusinessIcon sx={{ fontSize: 16, color: 'primary.main' }} />
                            {t('adminNotifications.details.company')}: {notification.company.name}
                          </Typography>
                        )}
                      </>
                    ) : (
                      <Stack spacing={0.5}>
                        <Typography variant="body2" sx={{ display: 'flex', alignItems: 'center', gap: 0.5, fontSize: '0.8rem' }}>
                          <BadgeIcon sx={{ fontSize: 14, color: 'primary.main' }} />
                          {t('adminNotifications.details.crNumber')}: {notification.crNumber || '-'}
                        </Typography>
                        <Typography variant="body2" sx={{ display: 'flex', alignItems: 'center', gap: 0.5, fontSize: '0.8rem' }}>
                          <BusinessIcon sx={{ fontSize: 14, color: 'primary.main' }} />
                          {t('adminNotifications.details.gosiNumber')}: {notification.gosiNumber || '-'}
                        </Typography>
                        <Typography variant="body2" sx={{ display: 'flex', alignItems: 'center', gap: 0.5, fontSize: '0.8rem' }}>
                          <PersonIcon sx={{ fontSize: 14, color: 'primary.main' }} />
                          {t('adminNotifications.details.sponserId')}: {notification.sponserId || '-'}
                        </Typography>
                        <Typography variant="body2" sx={{ display: 'flex', alignItems: 'center', gap: 0.5, fontSize: '0.8rem' }}>
                          <BadgeIcon sx={{ fontSize: 14, color: 'primary.main' }} />
                          {t('adminNotifications.details.molNumber')}: {notification.molNumber || '-'}
                        </Typography>
                      </Stack>
                    )}
                  </Stack>
                </TableCell>
                <TableCell>
                  {notification.amount ? (
                    <Typography variant="body2" sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                      <PaymentIcon sx={{ fontSize: 16, color: 'warning.main' }} />
                      SAR {notification.amount}
                    </Typography>
                  ) : '-'}
                </TableCell>
                <TableCell>
                  <Typography variant="body2">
                    {formatDate(notification.createdAt)}
                  </Typography>
                </TableCell>
                <TableCell align="right">
                  <Stack direction="row" spacing={1} justifyContent="flex-end">
                    <Tooltip title={t('adminNotifications.actions.approve')}>
                      <span>
                        <IconButton
                          size="small"
                          color="success"
                          onClick={() => handleApprove(notification, type)}
                          sx={{ 
                            bgcolor: 'success.lighter',
                            '&:hover': { bgcolor: 'success.light' }
                          }}
                        >
                          <CheckIcon fontSize="small" />
                        </IconButton>
                      </span>
                    </Tooltip>
                    <Tooltip title={t('adminNotifications.actions.reject')}>
                      <span>
                        <IconButton
                          size="small"
                          color="error"
                          onClick={() => handleReject(notification, type)}
                          sx={{ 
                            bgcolor: 'error.lighter',
                            '&:hover': { bgcolor: 'error.light' }
                          }}
                        >
                          <CloseIcon fontSize="small" />
                        </IconButton>
                      </span>
                    </Tooltip>
                  </Stack>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    );
  };

  return (
    <Box sx={{ width: '100%', minHeight: '100vh', bgcolor: 'background.default', pt: 4, pb: 6 }}>
      <Container maxWidth="lg">
        <Fade in timeout={800}>
          <Paper 
            elevation={0}
            sx={{ 
              p: 3,
              borderRadius: '24px',
              bgcolor: 'warning.light',
              color: 'warning.dark',
              mb: 4
            }}
          >
            <Box sx={{ 
              display: 'flex', 
              flexDirection: { xs: 'column', md: 'row' },
              alignItems: { xs: 'stretch', md: 'center' },
              gap: { xs: 2, md: 0 },
              justifyContent: 'space-between'
            }}>
              <Box sx={{ 
                display: 'flex', 
                alignItems: 'center',
                gap: 2
              }}>
                <Avatar sx={{ bgcolor: 'warning.main', width: 48, height: 48 }}>
                  <NotificationsIcon />
                </Avatar>
                <Box>
                  <Typography variant="h5" fontWeight="bold" color="warning.dark">
                    {t('adminNotifications.title')}
                  </Typography>
                  <Typography variant="body2" color="warning.dark">
                    {loading ? (
                      <Skeleton width={100} />
                    ) : (
                      t('adminNotifications.pendingCount', { count: individualNotifications.length + companyNotifications.length })
                    )}
                  </Typography>
                </Box>
              </Box>

              <Box sx={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: 2,
                width: { xs: '100%', md: 'auto' },
                justifyContent: { xs: 'center', md: 'flex-end' }
              }}>
                <Tabs 
                  value={tabValue} 
                  onChange={handleTabChange}
                  sx={{
                    '& .MuiTab-root': {
                      minWidth: 120,
                      fontWeight: 'medium',
                      color: 'warning.dark',
                      opacity: 0.7,
                      '&.Mui-selected': {
                        color: '#fff',
                        opacity: 1
                      }
                    },
                    '& .MuiTabs-indicator': {
                      backgroundColor: '#fff'
                    }
                  }}
                >
                  <Tab 
                    label={loading ? (
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <PersonIcon />
                        <Skeleton width={80} />
                      </Box>
                    ) : (
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <PersonIcon />
                        {t('adminNotifications.tabs.individual', { count: individualNotifications.length })}
                      </Box>
                    )}
                  />
                  <Tab 
                    label={loading ? (
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <BusinessIcon />
                        <Skeleton width={80} />
                      </Box>
                    ) : (
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <BusinessIcon />
                        {t('adminNotifications.tabs.company', { count: companyNotifications.length })}
                      </Box>
                    )}
                  />
                </Tabs>

                <Tooltip title={t('adminNotifications.refresh')}>
                  <span>
                    <IconButton 
                      onClick={handleRefresh}
                      disabled={loading || refreshing}
                      sx={{ 
                        bgcolor: 'warning.main',
                        color: '#fff',
                        '&:hover': { 
                          bgcolor: 'warning.dark', 
                          color: '#fff' 
                        },
                        '&.Mui-disabled': {
                          bgcolor: 'warning.main',
                          opacity: 0.5
                        }
                      }}
                    >
                      <RefreshIcon 
                        sx={{ 
                          animation: (loading || refreshing) ? 'spin 1s linear infinite' : 'none',
                          '@keyframes spin': {
                            '0%': {
                              transform: 'rotate(0deg)',
                            },
                            '100%': {
                              transform: 'rotate(360deg)',
                            },
                          },
                        }}
                      />
                    </IconButton>
                  </span>
                </Tooltip>
              </Box>
            </Box>
          </Paper>
        </Fade>

        <Fade in timeout={1000}>
          <Box>
            <TabPanel value={tabValue} index={0}>
              {renderNotificationsTable(individualNotifications, 'individual')}
            </TabPanel>
            <TabPanel value={tabValue} index={1}>
              {renderNotificationsTable(companyNotifications, 'company')}
            </TabPanel>
          </Box>
        </Fade>
      </Container>

      {/* Confirmation Dialog */}
      <Dialog
        open={confirmDialogOpen}
        onClose={() => setConfirmDialogOpen(false)}
        PaperProps={{
          sx: { borderRadius: 3 }
        }}
      >
        <DialogTitle sx={{ 
          bgcolor: dialogAction === 'approve' ? 'success.light' : 'error.light',
          color: dialogAction === 'approve' ? 'success.dark' : 'error.dark',
          py: 2
        }}>
          {dialogAction === 'approve' 
            ? t(`adminNotifications.dialog.approve.${selectedNotification?.type}`)
            : t(`adminNotifications.dialog.reject.${selectedNotification?.type}`)}
        </DialogTitle>
        <DialogContent sx={{ mt: 2 }}>
          <DialogContentText>
            {dialogAction === 'approve'
              ? t('adminNotifications.dialog.approve.message')
              : t('adminNotifications.dialog.reject.message')}
          </DialogContentText>
          {selectedNotification && (
            <Box sx={{ mt: 2 }}>
              <Typography variant="subtitle1" gutterBottom>
                <strong>{t('adminNotifications.dialog.details.name')}:</strong> {selectedNotification.name}
              </Typography>
              <Typography variant="subtitle1">
                <strong>
                  {selectedNotification.type === 'individual' 
                    ? t('adminNotifications.dialog.details.iqamaNumber')
                    : t('adminNotifications.dialog.details.crNumber')}:
                </strong> {
                  selectedNotification.type === 'individual' 
                    ? selectedNotification.iqamaNumber 
                    : selectedNotification.crNumber
                }
              </Typography>
              {selectedNotification.type === 'individual' && selectedNotification.company?.name && (
                <Typography variant="subtitle1">
                  <strong>{t('adminNotifications.dialog.details.company')}:</strong> {selectedNotification.company.name}
                </Typography>
              )}
              {selectedNotification.amount && (
                <Typography variant="subtitle1">
                  <strong>{t('adminNotifications.dialog.details.amount')}:</strong> SAR {selectedNotification.amount}
                </Typography>
              )}
            </Box>
          )}
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 3 }}>
          <Button 
            onClick={() => setConfirmDialogOpen(false)} 
            variant="outlined"
            color="inherit"
          >
            {t('common.cancel')}
          </Button>
          <Button 
            onClick={handleConfirmAction} 
            variant="contained"
            color={dialogAction === 'approve' ? 'success' : 'error'}
            autoFocus
          >
            {dialogAction === 'approve' ? t('adminNotifications.actions.approve') : t('adminNotifications.actions.reject')}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

export default AdminNotifications; 