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
  IconButton
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
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';

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
        const response = await individualApi.getExpiringSoon(mainPersonId);
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
      const response = await individualApi.getExpiringSoon(mainPersonId);
      setExpiringIds(response.data);
      
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
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Box display="flex" alignItems="center" gap={2} mb={4}>
        <IconButton onClick={() => navigate(-1)} sx={{ color: 'primary.main' }}>
          <ArrowBackIcon />
        </IconButton>
        <Typography variant="h4" fontWeight="bold">
          Expiring Soon IDs
        </Typography>
      </Box>

      <Paper elevation={0} sx={{ p: 3, mb: 4, bgcolor: 'warning.lighter', borderRadius: 3 }}>
        <Box display="flex" alignItems="center" gap={2}>
          <WarningIcon sx={{ fontSize: 40, color: 'warning.main' }} />
          <Box>
            <Typography variant="h5" color="warning.main" fontWeight="bold">
              Action Required
            </Typography>
            <Typography variant="subtitle1" color="warning.main">
              {expiringIds.length} IDs are expiring soon and need attention
            </Typography>
          </Box>
        </Box>
      </Paper>

      <Grid container spacing={3}>
        {expiringIds.map((individual) => (
          <Grid item xs={12} sm={6} md={4} key={individual._id}>
            <Card sx={{ 
              height: '100%',
              borderRadius: 2,
              border: '1px solid',
              borderColor: 'warning.main',
              transition: 'transform 0.2s ease-in-out',
              '&:hover': {
                transform: 'translateY(-4px)',
                boxShadow: 4
              }
            }}>
              <CardContent>
                <Box display="flex" flexDirection="column" gap={2}>
                  <Box display="flex" alignItems="center" gap={1}>
                    <PersonIcon color="warning" />
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
                        Expires on: {format(new Date(individual.expiryDate), 'dd/MM/yyyy')}
                      </Typography>
                    </Box>
                  </Box>

                  <Box display="flex" alignItems="center" justifyContent="space-between">
                    <Chip 
                      label={`Expires in ${individual.daysUntilExpiry} days`}
                      color="warning"
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
  );
}

export default ExpiringSoonIds; 