import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Box,
  Typography,
  Alert,
  Grid,
  Paper,
} from '@mui/material';
import { LocalizationProvider, DatePicker } from '@mui/x-date-pickers';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { format } from 'date-fns';
import { MonetizationOn as MonetizationIcon } from '@mui/icons-material';
import { iqamaPriceApi } from '../../services/api';

function IndividualDialog({ open, onClose, individual, onSubmit, mode = 'add', error }) {
  const initialFormData = {
    name: '',
    nationality: '',
    phoneNumber: '',
    iqamaNumber: '',
    expiryDate: null,
    referredBy: '',
    amount: '',
  };

  const [formData, setFormData] = useState(initialFormData);
  const [dateError, setDateError] = useState('');
  const [paymentError, setPaymentError] = useState('');
  const [currentIqamaPrice, setCurrentIqamaPrice] = useState(5000);

  const isRenewMode = mode === 'renew';
  const isAddMode = mode === 'add';

  useEffect(() => {
    if (mode === 'add') {
      setFormData(initialFormData);
    } else if (individual) {
      setFormData({
        name: individual.name || '',
        nationality: individual.nationality || '',
        phoneNumber: individual.phoneNumber || '',
        iqamaNumber: individual.iqamaNumber || '',
        expiryDate: individual.expiryDate ? new Date(individual.expiryDate) : null,
        referredBy: individual.referredBy || '',
        amount: individual.amount || '',
      });
    }
  }, [individual, mode]);

  useEffect(() => {
    const loadIqamaPrice = async () => {
      try {
        const response = await iqamaPriceApi.getCurrent();
        setCurrentIqamaPrice(response.data.price);
      } catch (error) {
        console.error('Error loading IQAMA price:', error);
      }
    };
    loadIqamaPrice();
  }, []);

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (paymentError) {
      return;
    }

    onSubmit({ ...formData, referredBy: formData.referredBy || '' });
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handlePaymentChange = (e) => {
    const value = parseFloat(e.target.value);
    if (value > currentIqamaPrice) {
      setPaymentError(`Amount cannot exceed ${currentIqamaPrice} SAR`);
    } else if (value < 0) {
      setPaymentError('Please enter a valid amount');
    } else {
      setPaymentError('');
    }
    
    setFormData(prev => ({
      ...prev,
      amount: e.target.value
    }));
  };

  const renderRenewalInfo = () => (
    <Paper sx={{ mb: 3, p: 2, bgcolor: 'grey.50', borderRadius: 1, border: '1px solid', borderColor: 'divider' }}>
      <Grid container spacing={2}>
        <Grid item xs={12}>
          <Typography variant="subtitle2" color="text.secondary" gutterBottom>
            Renewal Information for {individual?.name}
          </Typography>
        </Grid>
        <Grid item xs={12}>
          <Typography variant="body2" color="text.secondary">
            Full IQAMA Amount: SAR {currentIqamaPrice}
          </Typography>
          {individual?.lastUpdatedBy && (
            <Typography variant="caption" color="text.secondary" display="block" sx={{ mt: 1 }}>
              Last updated by {individual.lastUpdatedBy}
              {individual.lastUpdateDate && ` on ${format(new Date(individual.lastUpdateDate), 'dd MMM yyyy')}`}
            </Typography>
          )}
        </Grid>
      </Grid>
    </Paper>
  );

  return (
    <Dialog 
      open={open} 
      onClose={onClose} 
      maxWidth="sm" 
      fullWidth
      PaperProps={{ sx: { borderRadius: 2 } }}
    >
      <DialogTitle>
        {isAddMode ? 'Add Individual' : isRenewMode ? 'Renew ID' : 'Edit Individual'}
      </DialogTitle>
      <DialogContent>
        <Box sx={{ pt: 2 }}>
          {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
          {isRenewMode && renderRenewalInfo()}

          <Box component="form" onSubmit={handleSubmit} sx={{ mt: 2 }}>
            {!isRenewMode && (
              <Grid container spacing={2}>
                {['name', 'nationality', 'phoneNumber', 'iqamaNumber', 'referredBy'].map((field) => (
                  <Grid item xs={12} sm={6} key={field}>
                    <TextField
                      fullWidth
                      label={field.charAt(0).toUpperCase() + field.slice(1).replace(/([A-Z])/g, ' $1')}
                      name={field}
                      value={formData[field]}
                      onChange={handleChange}
                      required={['name', 'nationality', 'iqamaNumber'].includes(field)}
                    />
                  </Grid>
                ))}
                {isAddMode && (
                  <>
                    <Grid item xs={12} sm={6}>
                      <LocalizationProvider dateAdapter={AdapterDateFns}>
                        <DatePicker
                          label="Expiry Date"
                          value={formData.expiryDate}
                          onChange={(newValue) => setFormData(prev => ({ ...prev, expiryDate: newValue }))}
                          renderInput={(params) => <TextField {...params} fullWidth required />}
                          minDate={new Date()}
                          disablePast
                        />
                      </LocalizationProvider>
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <TextField
                        fullWidth
                        label="Payment Amount (SAR)"
                        name="amount"
                        type="number"
                        value={formData.amount}
                        onChange={handlePaymentChange}
                        required
                        error={!!paymentError}
                        helperText={paymentError || `Remaining amount will be ${currentIqamaPrice - (parseFloat(formData.amount) || 0)} SAR`}
                        inputProps={{
                          min: 0,
                          max: currentIqamaPrice,
                          step: "0.01"
                        }}
                      />
                    </Grid>
                  </>
                )}
              </Grid>
            )}

            {isRenewMode && (
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <LocalizationProvider dateAdapter={AdapterDateFns}>
                    <DatePicker
                      label="New Expiry Date"
                      value={formData.expiryDate}
                      onChange={(newValue) => {
                        setFormData(prev => ({ ...prev, expiryDate: newValue }));
                      }}
                      renderInput={(params) => (
                        <TextField 
                          {...params} 
                          fullWidth 
                          required 
                          helperText={`Current expiry: ${format(new Date(individual?.expiryDate), 'dd MMM yyyy')}`}
                        />
                      )}
                      minDate={new Date()}
                      disablePast
                    />
                  </LocalizationProvider>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Payment Amount (SAR)"
                    name="amount"
                    type="number"
                    value={formData.amount}
                    onChange={handlePaymentChange}
                    required
                    error={!!paymentError}
                    helperText={paymentError || `Remaining amount will be ${currentIqamaPrice - (parseFloat(formData.amount) || 0)} SAR`}
                    inputProps={{
                      min: 0,
                      max: currentIqamaPrice,
                      step: "0.01"
                    }}
                  />
                </Grid>
              </Grid>
            )}
          </Box>
        </Box>
      </DialogContent>
      <DialogActions sx={{ p: 2, bgcolor: 'background.default' }}>
        <Button onClick={onClose}>Cancel</Button>
        <Button 
          onClick={handleSubmit} 
          variant="contained" 
          color="primary"
          startIcon={isRenewMode ? <MonetizationIcon /> : undefined}
          disabled={!!paymentError}
        >
          {isRenewMode ? 'Renew & Reset Payment' : isAddMode ? 'Add' : 'Save Changes'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

export default IndividualDialog; 