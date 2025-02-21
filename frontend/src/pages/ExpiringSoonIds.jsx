import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Container, Typography, Box, Fade, Paper, IconButton, Alert,
  TextField, Stack, Avatar, LinearProgress, Tooltip,
  Divider, Grid, Chip, Card, CardContent
} from '@mui/material';
import { format } from 'date-fns';
import { individualApi } from '../services/api';
import { 
  Warning as WarningIcon,
  ArrowBack as ArrowBackIcon,
  Business as BusinessIcon,
  Person as PersonIcon,
  CalendarToday as CalendarIcon,
  NotificationsActive as NotificationsActiveIcon,
  AccessTime as AccessTimeIcon,
  Timeline as TimelineIcon,
  Assignment as AssignmentIcon,
  HourglassEmpty as HourglassIcon
} from '@mui/icons-material';
import { useAuth } from '../context/AuthContext';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { styled } from '@mui/material/styles';
import Button from '@mui/material/Button';

const StyledCard = styled(Paper)(({ theme }) => ({
  borderRadius: theme.shape.borderRadius * 3,
  backgroundColor: theme.palette.background.paper,
  transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
  position: 'relative',
  height: '100%',
  cursor: 'pointer',
  overflow: 'hidden',
  '&:hover': {
    transform: 'translateY(-8px)',
    boxShadow: '0 12px 24px rgba(0,0,0,0.1)',
    '& .hover-reveal': {
      opacity: 1,
      transform: 'translateY(0)',
    }
  },
  '&::after': {
    content: '""',
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: '4px',
    background: `linear-gradient(90deg, ${theme.palette.warning.main}, ${theme.palette.warning.light})`,
  }
}));

const StatusBadge = styled(Box)(({ theme }) => ({
  position: 'absolute',
  top: 16,
  right: 16,
  padding: '4px 12px',
  borderRadius: 20,
  backgroundColor: theme.palette.warning.lighter,
  color: theme.palette.warning.main,
  fontSize: '0.75rem',
  fontWeight: 600,
  display: 'flex',
  alignItems: 'center',
  gap: 4,
  boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
}));

function ExpiringSoonIds() {
  const [loading, setLoading] = useState(true);
  const [expiringIds, setExpiringIds] = useState([]);
  const [error, setError] = useState(null);
  const { mainPersonId } = useParams();
  const navigate = useNavigate();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedIndividual, setSelectedIndividual] = useState(null);
  const [newExpiryDate, setNewExpiryDate] = useState(null);
  const [dialogError, setDialogError] = useState('');
  const { admin } = useAuth();

  useEffect(() => {
    const fetchExpiringIds = async () => {
      try {
        setLoading(true);
        const response = await individualApi.getExpiringSoon(mainPersonId, 30);
        setExpiringIds(response.data);
      } catch (error) {
        console.error('Error fetching expiring IDs:', error);
        setError('Failed to load expiring IDs. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    if (mainPersonId) {
      fetchExpiringIds();
    }
  }, [mainPersonId]);

  const handleModify = (individual) => {
    setSelectedIndividual(individual);
    setNewExpiryDate(new Date(individual.expiryDate));
    setDialogOpen(true);
  };

  const handleSave = async () => {
    try {
      await individualApi.update(selectedIndividual._id, {
        expiryDate: newExpiryDate
      });
      
      // Refresh the list
      const response = await individualApi.getExpiringSoon(mainPersonId, 30);
      setExpiringIds(response.data);
      
      setDialogOpen(false);
      setDialogError('');
    } catch (error) {
      console.error('Error updating expiry date:', error);
      setDialogError(error.response?.data?.message || 'Failed to update expiry date');
    }
  };

  if (error) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Paper elevation={0} sx={{ p: 3, bgcolor: 'warning.lighter', borderRadius: 3 }}>
          <Typography color="warning.main">{error}</Typography>
          <Button onClick={() => window.location.reload()} sx={{ mt: 2 }}>
            Try Again
          </Button>
        </Paper>
      </Container>
    );
  }

  return (
    <Box sx={{ bgcolor: '#f8fafc', minHeight: '100vh' }}>
      {/* Header Section */}
      <Box
        sx={{
          background: 'linear-gradient(135deg, #ff9800 0%, #ffd54f 100%)',
          color: 'white',
          pt: 2,
          pb: 8,
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        <Container maxWidth="lg">
          <Stack direction="row" alignItems="center" spacing={2} sx={{ mb: 0 }}>
            <IconButton onClick={() => navigate(-1)} sx={{ color: 'white' }}>
              <ArrowBackIcon />
            </IconButton>
            <Box>
              <Typography variant="h4" fontWeight="bold">
                Upcoming ID Expiry Center
              </Typography>
              <Typography variant="subtitle1" sx={{ opacity: 0.9, mt: 0.5 }}>
                Click to view detailed information and take action
              </Typography>
            </Box>
          </Stack>

          {/* Stats Card */}
          <Card
            sx={{
              bgcolor: 'rgba(255,255,255,0.9)',
              backdropFilter: 'blur(20px)',
              mt: 0,
              borderRadius: 4,
              position: 'relative',
              transform: 'translateY(50%)',
            }}
          >
            <CardContent sx={{ p: 3 }}>
              <Grid container spacing={4}>
                <Grid item xs={12} md={4}>
                  <Stack direction="row" spacing={2} alignItems="center">
                    <Avatar sx={{ bgcolor: 'warning.light', width: 56, height: 56 }}>
                      <HourglassIcon />
                    </Avatar>
                    <Box>
                      <Typography variant="h4" color="warning.main" fontWeight="bold">
                        {loading ? <LinearProgress color="warning" /> : expiringIds.length}
                      </Typography>
                      <Typography variant="subtitle2" color="text.secondary">
                        IDs Expiring Soon
                      </Typography>
                    </Box>
                  </Stack>
                </Grid>
                <Grid item xs={12} md={4}>
                  <Stack direction="row" spacing={2} alignItems="center">
                    <Avatar sx={{ bgcolor: 'warning.light', width: 56, height: 56 }}>
                      <TimelineIcon />
                    </Avatar>
                    <Box>
                      <Typography variant="h4" color="warning.main" fontWeight="bold">
                        {loading ? <LinearProgress color="warning" /> : 
                          Math.min(...expiringIds.map(id => id.daysUntilExpiry)) || 0}
                      </Typography>
                      <Typography variant="subtitle2" color="text.secondary">
                        Days Until Next Expiry
                      </Typography>
                    </Box>
                  </Stack>
                </Grid>
                <Grid item xs={12} md={4}>
                  <Stack direction="row" spacing={2} alignItems="center">
                    <Avatar sx={{ bgcolor: 'warning.light', width: 56, height: 56 }}>
                      <AssignmentIcon />
                    </Avatar>
                    <Box>
                      <Typography variant="h4" color="warning.main" fontWeight="bold">
                        {loading ? <LinearProgress color="warning" /> : 
                          new Set(expiringIds.map(id => id.company._id)).size}
                      </Typography>
                      <Typography variant="subtitle2" color="text.secondary">
                        Companies Affected
                      </Typography>
                    </Box>
                  </Stack>
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Container>
      </Box>

      {/* Main Content */}
      <Container maxWidth="lg" sx={{ mt: 3, pb: 6 }}>
        <Fade in timeout={800}>
          <Grid container spacing={3}>
            {loading ? (
              [...Array(6)].map((_, index) => (
                <Grid item xs={12} md={6} lg={4} key={index}>
                  <StyledCard sx={{ p: 3 }}>
                    <LinearProgress color="warning" />
                  </StyledCard>
                </Grid>
              ))
            ) : (
              expiringIds.map((individual) => (
                <Grid item xs={12} md={6} lg={4} key={individual._id}>
                  <StyledCard
                    onClick={() => navigate(`/company/${individual.company._id}/individuals`)}
                  >
                    <StatusBadge>
                      <AccessTimeIcon sx={{ fontSize: 16 }} />
                      {individual.daysUntilExpiry} days until expiry
                    </StatusBadge>
                    
                    <Box sx={{ p: 3 }}>
                      <Stack spacing={3}>
                        <Stack direction="row" spacing={2} alignItems="center">
                          <Avatar
                            sx={{
                              width: 60,
                              height: 60,
                              bgcolor: 'grey.100',
                              border: '2px solid',
                              borderColor: 'warning.light'
                            }}
                          >
                            <PersonIcon color="warning" />
                          </Avatar>
                          <Box>
                            <Typography variant="h6" fontWeight="bold">
                              {individual.name}
                            </Typography>
                            <Chip
                              size="small"
                              label={individual.iqamaNumber}
                              sx={{ mt: 0.5 }}
                            />
                          </Box>
                        </Stack>

                        <Divider />

                        <Stack spacing={2}>
                          <Stack direction="row" alignItems="center" spacing={1}>
                            <BusinessIcon color="action" />
                            <Typography variant="body1" color="text.primary">
                              {individual.company.name}
                            </Typography>
                          </Stack>
                          <Stack direction="row" alignItems="center" spacing={1}>
                            <CalendarIcon color="warning" />
                            <Typography variant="body1" color="warning.main" fontWeight="medium">
                              Expires on {format(new Date(individual.expiryDate), 'dd MMM yyyy')}
                            </Typography>
                          </Stack>
                        </Stack>
                      </Stack>
                    </Box>
                  </StyledCard>
                </Grid>
              ))
            )}
          </Grid>
        </Fade>

        {/* Dialog */}
        <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)}>
          <DialogTitle>Modify Expiry Date</DialogTitle>
          <DialogContent>
            <Box sx={{ mt: 2 }}>
              {dialogError && (
                <Alert severity="error" sx={{ mb: 2 }}>
                  {dialogError}
                </Alert>
              )}
              <LocalizationProvider dateAdapter={AdapterDateFns}>
                <DatePicker
                  label="New Expiry Date"
                  value={newExpiryDate}
                  onChange={(newValue) => setNewExpiryDate(newValue)}
                  renderInput={(params) => <TextField {...params} fullWidth />}
                />
              </LocalizationProvider>
              <Typography 
                variant="body2" 
                sx={{ 
                  mt: 3,
                  color: 'text.secondary',
                  bgcolor: 'grey.50',
                  p: 2,
                  borderRadius: 2,
                  border: '1px solid',
                  borderColor: 'grey.200'
                }}
              >
                Updating expiry date for <b>{selectedIndividual?.name}</b>'s ID
              </Typography>
            </Box>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleSave} variant="contained" color="primary">
              Save
            </Button>
          </DialogActions>
        </Dialog>
      </Container>
    </Box>
  );
}

export default ExpiringSoonIds; 