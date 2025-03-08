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
  Tooltip
} from '@mui/material';
import {
  Check as CheckIcon,
  Close as CloseIcon,
  NotificationsActive as NotificationsIcon,
  Person as PersonIcon,
  Badge as BadgeIcon,
  CalendarToday as CalendarIcon,
  AccountCircle as AccountCircleIcon
} from '@mui/icons-material';
import { format } from 'date-fns';
import { notifyAdminApi, individualApi } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';

function AdminNotifications() {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [selectedNotification, setSelectedNotification] = useState(null);
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);
  const [dialogAction, setDialogAction] = useState('');

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
        const response = await notifyAdminApi.getAll();
        setNotifications(response.data);
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

  const handleApprove = (notification) => {
    setSelectedNotification(notification);
    setDialogAction('approve');
    setConfirmDialogOpen(true);
  };

  const handleReject = (notification) => {
    setSelectedNotification(notification);
    setDialogAction('reject');
    setConfirmDialogOpen(true);
  };

  const handleConfirmAction = async () => {
    try {
      if (dialogAction === 'approve') {
        await notifyAdminApi.approve(selectedNotification._id);
        toast.success('Individual approved and added to system');
      } else if (dialogAction === 'reject') {
        await notifyAdminApi.delete(selectedNotification._id);
        toast.success('Individual rejected and notification deleted');
      }
      
      // Refresh notifications list
      const response = await notifyAdminApi.getAll();
      setNotifications(response.data);
      
      setConfirmDialogOpen(false);
      setSelectedNotification(null);
    } catch (error) {
      console.error('Error processing notification:', error);
      toast.error('Failed to process notification');
    }
  };

  const formatDate = (date) => {
    return format(new Date(date), 'dd MMM yyyy');
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
                  {notifications.length} pending approval{notifications.length !== 1 ? 's' : ''}
                </Typography>
              </Box>
            </Box>
          </Paper>
        </Fade>

        <Fade in timeout={1000}>
          <Box>
            {notifications.length === 0 ? (
              <Paper sx={{ p: 4, textAlign: 'center', borderRadius: 3 }}>
                <NotificationsIcon sx={{ fontSize: 64, color: 'text.disabled', mb: 2 }} />
                <Typography variant="h6" color="text.secondary">
                  No pending notifications
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  All individual requests have been processed
                </Typography>
              </Paper>
            ) : (
              <TableContainer component={Paper} sx={{ borderRadius: 3, overflow: 'hidden' }}>
                <Table>
                  <TableHead>
                    <TableRow sx={{ bgcolor: 'background.default' }}>
                      <TableCell>Name</TableCell>
                      <TableCell>Nationality</TableCell>
                      <TableCell>Iqama Number</TableCell>
                      <TableCell>Expiry Date</TableCell>
                      <TableCell>Added By</TableCell>
                      <TableCell>Added On</TableCell>
                      <TableCell align="right">Actions</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {notifications.map((notification) => (
                      <TableRow 
                        key={notification._id}
                        sx={{ '&:hover': { bgcolor: 'action.hover' } }}
                      >
                        <TableCell>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <PersonIcon color="primary" fontSize="small" />
                            {notification.name}
                          </Box>
                        </TableCell>
                        <TableCell>{notification.nationality}</TableCell>
                        <TableCell>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <BadgeIcon color="primary" fontSize="small" />
                            {notification.iqamaNumber}
                          </Box>
                        </TableCell>
                        <TableCell>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <CalendarIcon color="primary" fontSize="small" />
                            {formatDate(notification.expiryDate)}
                          </Box>
                        </TableCell>
                        <TableCell>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <AccountCircleIcon color="primary" fontSize="small" />
                            {notification.addedBy?.username || 'Unknown'}
                          </Box>
                        </TableCell>
                        <TableCell>{formatDate(notification.createdAt)}</TableCell>
                        <TableCell align="right">
                          <Stack direction="row" spacing={1} justifyContent="flex-end">
                            <Tooltip title="Approve">
                              <IconButton
                                size="small"
                                onClick={() => handleApprove(notification)}
                                sx={{
                                  bgcolor: 'success.light',
                                  color: 'success.dark',
                                  '&:hover': { bgcolor: 'success.main', color: 'white' }
                                }}
                              >
                                <CheckIcon fontSize="small" />
                              </IconButton>
                            </Tooltip>
                            <Tooltip title="Reject">
                              <IconButton
                                size="small"
                                onClick={() => handleReject(notification)}
                                sx={{
                                  bgcolor: 'error.light',
                                  color: 'error.dark',
                                  '&:hover': { bgcolor: 'error.main', color: 'white' }
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
            )}
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
          {dialogAction === 'approve' ? 'Approve Individual' : 'Reject Individual'}
        </DialogTitle>
        <DialogContent sx={{ mt: 2 }}>
          <DialogContentText>
            {dialogAction === 'approve' 
              ? 'Are you sure you want to approve this individual? This will add them to the system.'
              : 'Are you sure you want to reject this individual? This will delete the notification.'}
          </DialogContentText>
          {selectedNotification && (
            <Box sx={{ mt: 2 }}>
              <Typography variant="subtitle1" gutterBottom>
                <strong>Name:</strong> {selectedNotification.name}
              </Typography>
              <Typography variant="subtitle1">
                <strong>Iqama Number:</strong> {selectedNotification.iqamaNumber}
              </Typography>
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