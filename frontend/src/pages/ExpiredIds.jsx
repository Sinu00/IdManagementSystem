import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Container,
  Typography,
  Box,
  Grid,
  Card,
  CardContent,
  CircularProgress,
  Fade,
  Chip,
  Paper,
  Button,
  IconButton,
  Alert,
  TextField
} from '@mui/material';
import { format } from 'date-fns';
import { individualApi } from '../services/api';
import { 
  Warning as WarningIcon,
  ArrowBack as ArrowBackIcon,
  Business as BusinessIcon,
  Person as PersonIcon,
  Event as EventIcon,
  Badge as BadgeIcon,
  Edit as EditIcon
} from '@mui/icons-material';
import { useAuth } from '../context/AuthContext';
import CustomDialog from '../components/dialogs/CustomDialog';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { styled } from '@mui/material/styles';

const StyledDatePicker = styled(DatePicker)(({ theme }) => ({
  width: '100%',
  '& .MuiOutlinedInput-root': {
    borderRadius: theme.shape.borderRadius * 2,
    backgroundColor: theme.palette.background.paper,
    transition: 'all 0.2s',
    '&:hover': {
      backgroundColor: theme.palette.grey[50],
      '& .MuiOutlinedInput-notchedOutline': {
        borderColor: theme.palette.primary.main,
        borderWidth: 2
      }
    },
    '&.Mui-focused': {
      '& .MuiOutlinedInput-notchedOutline': {
        borderColor: theme.palette.primary.main,
        borderWidth: 2
      },
      backgroundColor: theme.palette.background.paper
    }
  },
  '& .MuiInputLabel-root': {
    '&.Mui-focused': {
      color: theme.palette.primary.main
    }
  }
}));

function ExpiredIds() {
  const [loading, setLoading] = useState(true);
  const [expiredIds, setExpiredIds] = useState([]);
  const [error, setError] = useState(null);
  const { mainPersonId } = useParams();
  const navigate = useNavigate();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedIndividual, setSelectedIndividual] = useState(null);
  const [newExpiryDate, setNewExpiryDate] = useState(null);
  const [dialogError, setDialogError] = useState('');
  const { admin } = useAuth();

  useEffect(() => {
    const fetchExpiredIds = async () => {
      try {
        setLoading(true);
        const response = await individualApi.getExpired(mainPersonId);
        setExpiredIds(response.data);
      } catch (error) {
        console.error('Error fetching expired IDs:', error);
        setError('Failed to load expired IDs. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    if (mainPersonId) {
      fetchExpiredIds();
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
      
      const response = await individualApi.getExpired(mainPersonId);
      setExpiredIds(response.data);
      
      setDialogOpen(false);
      setDialogError('');
    } catch (error) {
      console.error('Error updating expiry date:', error);
      setDialogError(error.response?.data?.message || 'Failed to update expiry date');
    }
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="100vh">
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Paper elevation={0} sx={{ p: 3, bgcolor: 'error.lighter', borderRadius: 3 }}>
          <Typography color="error">{error}</Typography>
          <Button onClick={() => window.location.reload()} sx={{ mt: 2 }}>
            Try Again
          </Button>
        </Paper>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Box display="flex" alignItems="center" gap={2} mb={4}>
        <IconButton onClick={() => navigate(-1)} sx={{ color: 'primary.main' }}>
          <ArrowBackIcon />
        </IconButton>
        <Typography variant="h4" fontWeight="bold">
          Expired IDs
        </Typography>
      </Box>

      <Paper elevation={0} sx={{ p: 3, mb: 4, bgcolor: 'error.lighter', borderRadius: 3 }}>
        <Box display="flex" alignItems="center" gap={2}>
          <WarningIcon sx={{ fontSize: 40, color: 'error.main' }} />
          <Box>
            <Typography variant="h5" color="error.main" fontWeight="bold">
              Attention Required
            </Typography>
            <Typography variant="subtitle1" color="error.main">
              {expiredIds.length} IDs have expired and need immediate attention
            </Typography>
          </Box>
        </Box>
      </Paper>

      <Grid container spacing={3}>
        {expiredIds.map((individual) => (
          <Grid item xs={12} sm={6} md={4} key={individual._id}>
            <Card sx={{ 
              height: '100%',
              borderRadius: 2,
              border: '1px solid',
              borderColor: 'error.main',
              transition: 'transform 0.2s ease-in-out',
              '&:hover': {
                transform: 'translateY(-4px)',
                boxShadow: 4
              }
            }}>
              <CardContent>
                <Box display="flex" flexDirection="column" gap={2}>
                  <Box display="flex" alignItems="center" gap={1}>
                    <PersonIcon color="error" />
                    <Typography variant="h6">
                      {individual.name}
                    </Typography>
                  </Box>
                  
                  <Box display="flex" flexDirection="column" gap={1}>
                    <Box display="flex" alignItems="center" gap={1}>
                      <BadgeIcon fontSize="small" color="action" />
                      <Typography variant="body2" color="text.secondary">
                        ID: {individual.idNumber}
                      </Typography>
                    </Box>
                    
                    <Box display="flex" alignItems="center" gap={1}>
                      <BusinessIcon fontSize="small" color="action" />
                      <Typography variant="body2" color="text.secondary">
                        {individual.company.name}
                      </Typography>
                    </Box>
                    
                    <Box display="flex" alignItems="center" gap={1}>
                      <EventIcon fontSize="small" color="action" />
                      <Typography variant="body2" color="text.secondary">
                        Expired on: {format(new Date(individual.expiryDate), 'dd/MM/yyyy')}
                      </Typography>
                    </Box>
                  </Box>

                  <Box display="flex" alignItems="center" justifyContent="space-between">
                    <Chip 
                      label="Expired"
                      color="error"
                      size="small"
                    />
                    {admin && (
                      <IconButton 
                        size="small"
                        onClick={() => handleModify(individual)}
                        color="primary"
                      >
                        <EditIcon />
                      </IconButton>
                    )}
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      <CustomDialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        title="Modify Expiry Date"
        onSubmit={handleSave}
        error={dialogError}
      >
        <Box sx={{ mt: 1 }}>
          <LocalizationProvider dateAdapter={AdapterDateFns}>
            <StyledDatePicker
              label="New Expiry Date"
              value={newExpiryDate}
              onChange={(newValue) => setNewExpiryDate(newValue)}
              renderInput={(params) => (
                <TextField 
                  {...params} 
                  fullWidth
                  variant="outlined"
                />
              )}
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
      </CustomDialog>
    </Container>
  );
}

export default ExpiredIds; 