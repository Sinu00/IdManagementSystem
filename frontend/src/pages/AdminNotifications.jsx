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
  Business as BusinessIcon
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

  // Fetch notifications
  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        setLoading(true);
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
        
        setIndividualNotifications(Array.isArray(individualRes.data) ? individualRes.data : []);
        setCompanyNotifications(Array.isArray(companyRes.data) ? companyRes.data : []);
        setLoading(false);
      } catch (error) {
        console.error('Error fetching notifications:', error);
        setError('Failed to load notifications');
        setLoading(false);
        
        if (error.response?.status === 401) {
          logout();
        }
      }
    };

    fetchNotifications();
  }, [logout]);

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
        const response = await axios.post(
          `${API_BASE_URL}${endpoint}/${selectedNotification._id}/approve`, 
          {
            name: selectedNotification.name,
            email: selectedNotification.email,
            crNumber: selectedNotification.crNumber,
            contactPerson: selectedNotification.contactPerson,
            amount: selectedNotification.amount,
            requestType: selectedNotification.requestType
          }, 
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
      
      setIndividualNotifications(Array.isArray(individualRes.data) ? individualRes.data : []);
      setCompanyNotifications(Array.isArray(companyRes.data) ? companyRes.data : []);
      
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

  const getRequestTypeChip = (requestType) => {
    let color;
    let icon;
    switch (requestType) {
      case 'ADD':
        color = 'primary';
        icon = <AddIcon />;
        break;
      case 'RENEW':
        color = 'success';
        icon = <RenewIcon />;
        break;
      case 'PAYMENT':
        color = 'warning';
        icon = <PaymentIcon />;
        break;
      default:
        color = 'default';
        icon = <NotificationsIcon />;
    }
    return (
      <Chip
        icon={icon}
        label={requestType}
        color={color}
        size="small"
        sx={{ 
          '& .MuiChip-icon': { fontSize: 16 },
          fontWeight: 'medium'
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
              <TableCell>{type === 'individual' ? 'Individual' : 'Company'}</TableCell>
              <TableCell>{type === 'individual' ? 'Company' : 'Contact Person'}</TableCell>
              <TableCell>Details</TableCell>
              <TableCell>Requested By</TableCell>
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
                  {getRequestTypeChip(notification.requestType)}
                </TableCell>
                <TableCell>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Avatar 
                      sx={{ 
                        width: 32, 
                        height: 32,
                        bgcolor: 'primary.lighter',
                        color: 'primary.main'
                      }}
                    >
                      {notification.name?.charAt(0)}
                    </Avatar>
                    <Box>
                      <Typography variant="subtitle2">
                        {notification.name}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {type === 'individual' ? notification.nationality : notification.email}
                      </Typography>
                    </Box>
                  </Box>
                </TableCell>
                <TableCell>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <BusinessIcon sx={{ fontSize: 16, color: 'primary.main' }} />
                    <Typography variant="body2">
                      {type === 'individual' 
                        ? (notification.company?.name || 'N/A')
                        : (notification.contactPerson || 'N/A')}
                    </Typography>
                  </Box>
                </TableCell>
                <TableCell>
                  <Stack spacing={0.5}>
                    <Typography variant="body2" sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                      <BadgeIcon sx={{ fontSize: 16, color: 'primary.main' }} />
                      {type === 'individual' ? `Iqama: ${notification.iqamaNumber}` : `CR: ${notification.crNumber}`}
                    </Typography>
                    {notification.amount && (
                      <Typography variant="body2" sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                        <PaymentIcon sx={{ fontSize: 16, color: 'warning.main' }} />
                        Amount: SAR {notification.amount}
                      </Typography>
                    )}
                  </Stack>
                </TableCell>
                <TableCell>
                  <Typography variant="body2">
                    {notification.addedBy?.username || 'Unknown'}
                  </Typography>
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
              alignItems: 'center',
              gap: 2
            }}>
              <Avatar sx={{ bgcolor: 'warning.main', width: 48, height: 48 }}>
                <NotificationsIcon />
              </Avatar>
              <Box>
                <Typography variant="h5" fontWeight="bold" color="warning.dark">
                  Admin Notifications
                </Typography>
                <Typography variant="body2" color="warning.dark">
                  {totalNotifications} pending approval{totalNotifications !== 1 ? 's' : ''}
                </Typography>
              </Box>
            </Box>
          </Paper>
        </Fade>

        <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
          <Tabs 
            value={tabValue} 
            onChange={handleTabChange}
            sx={{
              '& .MuiTab-root': {
                minWidth: 120,
                fontWeight: 'medium'
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
        </Box>

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