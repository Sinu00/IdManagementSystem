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
  Tab
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
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

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

function AdminNotifications() {
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
        axios.get(`${API_BASE_URL}/api/notify-admin`, config),
        axios.get(`${API_BASE_URL}/api/notify-company-admin`, config)
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
      const config = {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      };

      const endpoint = selectedNotification.type === 'individual' 
        ? '/api/notify-admin' 
        : '/api/notify-company-admin';

      if (dialogAction === 'approve') {
        // Send all the necessary data for company creation
        const payload = selectedNotification.type === 'company' ? {
          name: selectedNotification.name,
          crNumber: selectedNotification.crNumber,
          sponserId: selectedNotification.sponserId,
          gosiNumber: selectedNotification.gosiNumber,
          molNumber: selectedNotification.molNumber,
          mainPerson: selectedNotification.mainPerson?._id,
          amount: selectedNotification.amount,
          requestType: selectedNotification.requestType,
          paymentType: selectedNotification.paymentType,
          originalCompany: selectedNotification.originalCompany?._id
        } : {
          name: selectedNotification.name,
          email: selectedNotification.email,
          crNumber: selectedNotification.crNumber,
          contactPerson: selectedNotification.contactPerson,
          amount: selectedNotification.amount,
          requestType: selectedNotification.requestType
        };

        console.log('Approval payload:', payload);

        const response = await axios.post(
          `${API_BASE_URL}${endpoint}/${selectedNotification._id}/approve`, 
          payload,
          config
        );
        
        if (response.status === 200) {
          toast.success(`${selectedNotification.type === 'individual' ? 'Individual' : 'Company'} approved successfully`);
        }
      } else if (dialogAction === 'reject') {
        const response = await axios.post(
          `${API_BASE_URL}${endpoint}/${selectedNotification._id}/reject`, 
          {}, 
          config
        );
        
        if (response.status === 200) {
          toast.success(`${selectedNotification.type === 'individual' ? 'Individual' : 'Company'} rejected successfully`);
        }
      }
      
      // Refresh notifications
      const [individualRes, companyRes] = await Promise.all([
        axios.get(`${API_BASE_URL}/api/notify-admin`, config),
        axios.get(`${API_BASE_URL}/api/notify-company-admin`, config)
      ]);
      
      // Process company notifications to include company details
      const processedCompanyNotifications = companyRes.data.map(notification => {
        if (notification.requestType === 'PAYMENT') {
          const originalCompany = notification.originalCompany;
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
      
      setIndividualNotifications(Array.isArray(individualRes.data) ? individualRes.data : []);
      setCompanyNotifications(Array.isArray(processedCompanyNotifications) ? processedCompanyNotifications : []);
      
      setConfirmDialogOpen(false);
      setSelectedNotification(null);
    } catch (error) {
      console.error('Error processing notification:', error.response?.data || error.message);
      toast.error(
        error.response?.data?.message || 
        `Failed to ${dialogAction} ${selectedNotification?.type} notification. Please try again.`
      );
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
    let label = requestType;

    // If it's a payment request, combine the payment type
    if (requestType === 'PAYMENT' && paymentType) {
      label = `${paymentType.toUpperCase()} PAYMENT`;
      color = 'warning';
      icon = <PaymentIcon />;
    } else {
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
    if (notifications.length === 0) {
      return (
        <Paper sx={{ p: 4, textAlign: 'center', borderRadius: 3 }}>
          <NotificationsIcon sx={{ fontSize: 64, color: 'text.disabled', mb: 2 }} />
          <Typography variant="h6" color="text.secondary">
            No pending notifications
          </Typography>
          <Typography variant="body2" color="text.secondary">
            All {type} requests have been processed
          </Typography>
        </Paper>
      );
    }

    return (
      <TableContainer component={Paper} sx={{ borderRadius: 3, boxShadow: 2 }}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Type</TableCell>
              <TableCell>Requested By</TableCell>
              <TableCell>{type === 'individual' ? 'Individual' : 'Company'}</TableCell>
              <TableCell>Details</TableCell>
              <TableCell>Amount</TableCell>
              <TableCell>Date</TableCell>
              <TableCell align="right">Actions</TableCell>
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
                          Iqama: {notification.iqamaNumber}
                        </Typography>
                        {notification.company?.name && (
                          <Typography variant="body2" sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                            <BusinessIcon sx={{ fontSize: 16, color: 'primary.main' }} />
                            Company: {notification.company.name}
                          </Typography>
                        )}
                      </>
                    ) : (
                      <Stack spacing={0.5}>
                        <Typography 
                          variant="body2" 
                          sx={{ 
                            display: 'flex', 
                            alignItems: 'center', 
                            gap: 0.5,
                            fontSize: '0.8rem'
                          }}
                        >
                          <BadgeIcon sx={{ fontSize: 14, color: 'primary.main' }} />
                          CR Number: {notification.crNumber || '-'}
                        </Typography>
                        <Typography 
                          variant="body2" 
                          sx={{ 
                            display: 'flex', 
                            alignItems: 'center', 
                            gap: 0.5,
                            fontSize: '0.8rem'
                          }}
                        >
                          <BusinessIcon sx={{ fontSize: 14, color: 'primary.main' }} />
                          GOSI Number: {notification.gosiNumber || '-'}
                        </Typography>
                        <Typography 
                          variant="body2" 
                          sx={{ 
                            display: 'flex', 
                            alignItems: 'center', 
                            gap: 0.5,
                            fontSize: '0.8rem'
                          }}
                        >
                          <PersonIcon sx={{ fontSize: 14, color: 'primary.main' }} />
                          Sponsor ID: {notification.sponserId || '-'}
                        </Typography>
                        <Typography 
                          variant="body2" 
                          sx={{ 
                            display: 'flex', 
                            alignItems: 'center', 
                            gap: 0.5,
                            fontSize: '0.8rem'
                          }}
                        >
                          <BadgeIcon sx={{ fontSize: 14, color: 'primary.main' }} />
                          MOL Number: {notification.molNumber || '-'}
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
                    <Tooltip title="Approve">
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
                    </Tooltip>
                    <Tooltip title="Reject">
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

  if (loading) {
    return (
      <Box sx={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center',
        minHeight: '100vh'
      }}>
        <CircularProgress />
      </Box>
    );
  }

  const totalNotifications = individualNotifications.length + companyNotifications.length;

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
                    Approval Requests
                  </Typography>
                  <Typography variant="body2" color="warning.dark">
                    {totalNotifications} pending approval{totalNotifications !== 1 ? 's' : ''}
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
                      },
                      '&:focus': {
                        outline: 'none'
                      },
                      '&.MuiTab-root': {
                        border: 'none'
                      }
                    },
                    '& .MuiTabs-indicator': {
                      backgroundColor: '#fff'
                    }
                  }}
                >
                  <Tab 
                    label={`Individual (${individualNotifications.length})`}
                    icon={<PersonIcon />}
                    iconPosition="start"
                  />
                  <Tab 
                    label={`Company (${companyNotifications.length})`}
                    icon={<BusinessIcon />}
                    iconPosition="start"
                  />
                </Tabs>

                <Tooltip title="Refresh">
                  <IconButton 
                    onClick={handleRefresh}
                    sx={{ 
                      bgcolor: 'warning.main',
                      color: '#fff',
                      '&:hover': { 
                        bgcolor: 'warning.dark', 
                        color: '#fff' 
                      }
                    }}
                  >
                    <RefreshIcon 
                      sx={{ 
                        animation: refreshing ? 'spin 1s linear infinite' : 'none',
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
          {dialogAction === 'approve' ? `Approve ${selectedNotification?.type}` : `Reject ${selectedNotification?.type}`}
        </DialogTitle>
        <DialogContent sx={{ mt: 2 }}>
          <DialogContentText>
            {dialogAction === 'approve' 
              ? `Are you sure you want to approve this ${selectedNotification?.type}? This will add them to the system.`
              : `Are you sure you want to reject this ${selectedNotification?.type}? This will delete the notification.`}
          </DialogContentText>
          {selectedNotification && (
            <Box sx={{ mt: 2 }}>
              <Typography variant="subtitle1" gutterBottom>
                <strong>Name:</strong> {selectedNotification.name}
              </Typography>
              <Typography variant="subtitle1">
                <strong>{selectedNotification.type === 'individual' ? 'Iqama Number' : 'CR Number'}:</strong> {
                  selectedNotification.type === 'individual' ? selectedNotification.iqamaNumber : selectedNotification.crNumber
                }
              </Typography>
              {selectedNotification.type === 'individual' && selectedNotification.company?.name && (
                <Typography variant="subtitle1">
                  <strong>Company:</strong> {selectedNotification.company.name}
                </Typography>
              )}
              {selectedNotification.amount && (
                <Typography variant="subtitle1">
                  <strong>Amount:</strong> SAR {selectedNotification.amount}
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
            Cancel
          </Button>
          <Button 
            onClick={handleConfirmAction} 
            variant="contained"
            color={dialogAction === 'approve' ? 'success' : 'error'}
            autoFocus
          >
            {dialogAction === 'approve' ? 'Approve' : 'Reject'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

export default AdminNotifications; 