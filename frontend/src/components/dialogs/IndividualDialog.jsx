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
  const [validationErrors, setValidationErrors] = useState({});

  const isRenewMode = mode === 'renew';
  const isAddMode = mode === 'add';

  // Validation functions
  const validateIqamaNumber = (value) => {
    const numericValue = value.replace(/\D/g, '');
    if (numericValue.length !== 10) {
      return 'Iqama number must be exactly 10 digits';
    }
    if (!/^\d+$/.test(numericValue)) {
      return 'Iqama number must contain only numbers';
    }
    return '';
  };

  const validatePhoneNumber = (value) => {
    const numericValue = value.replace(/\D/g, '');
    if (numericValue.length !== 10) {
      return 'Phone number must be exactly 10 digits';
    }
    if (!/^\d+$/.test(numericValue)) {
      return 'Phone number must contain only numbers';
    }
    return '';
  };

  const validateName = (value) => {
    if (!value) return 'Name is required';
    return '';
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    let formattedValue = value;
    let error = '';

    switch (name) {
      case 'name':
        error = validateName(value);
        break;
      
      case 'iqamaNumber':
        // Only allow numbers and limit to 10 digits
        formattedValue = value.replace(/\D/g, '').slice(0, 10);
        error = validateIqamaNumber(formattedValue);
        break;
      
      case 'phoneNumber':
        // Only allow numbers and limit to 10 digits
        formattedValue = value.replace(/\D/g, '').slice(0, 10);
        error = validatePhoneNumber(formattedValue);
        break;
      
      default:
        break;
    }

    setValidationErrors(prev => ({
      ...prev,
      [name]: error
    }));

    setFormData(prev => ({
      ...prev,
      [name]: formattedValue
    }));
  };

  const isFormValid = () => {
    const errors = {
      name: validateName(formData.name),
      iqamaNumber: validateIqamaNumber(formData.iqamaNumber),
      phoneNumber: validatePhoneNumber(formData.phoneNumber)
    };

    setValidationErrors(errors);

    return !Object.values(errors).some(error => error !== '');
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

  const handleSubmit = (e) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }

    let errors = {};
    
    if (isRenewMode) {
      if (!formData.expiryDate) {
        errors.expiryDate = 'Expiry date is required';
      }
      if (!formData.amount) {
        errors.amount = 'Payment amount is required';
      }
    } else {
      // Validation for add/edit mode
      if (!formData.name) {
        errors.name = 'Name is required';
      }
      if (!formData.nationality) {
        errors.nationality = 'Nationality is required';
      }
      if (!formData.iqamaNumber) {
        errors.iqamaNumber = 'Iqama number is required';
      } else {
        const iqamaError = validateIqamaNumber(formData.iqamaNumber);
        if (iqamaError) errors.iqamaNumber = iqamaError;
      }
      if (formData.phoneNumber) {
        const phoneError = validatePhoneNumber(formData.phoneNumber);
        if (phoneError) errors.phoneNumber = phoneError;
      }
      if (isAddMode && !formData.expiryDate) {
        errors.expiryDate = 'Expiry date is required';
      }
    }

    setValidationErrors(errors);

    // Only proceed if there are no errors
    if (Object.keys(errors).length === 0) {
      let submitData = { ...formData };
      
      if (!isRenewMode) {
        // For add/edit mode
        submitData = {
          ...submitData,
          name: formData.name?.charAt(0).toUpperCase() + formData.name?.slice(1),
          amount: isAddMode ? (parseFloat(formData.amount) || 0) : undefined
        };
      } else {
        // For renew mode
        submitData = {
          expiryDate: formData.expiryDate,
          amount: parseFloat(formData.amount) || 0
        };
      }

      onSubmit(submitData);
    }
  };

  // Focus first input when dialog opens (modified to work for renew mode)
  useEffect(() => {
    if (open) {
      const timer = setTimeout(() => {
        if (mode === 'renew') {
          // For renew mode, focus the expiry date input
          const expiryInput = document.querySelector('input[name="expiryDate"]');
          if (expiryInput) {
            expiryInput.focus();
          }
        } else if (mode === 'add' || mode === 'edit') {
          // For add/edit mode, focus the name input
          const nameInput = document.querySelector('input[name="name"]');
          if (nameInput) {
            nameInput.focus();
          }
        }
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [open, mode]);

  // Modified keyPress handler to work for all modes
  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      e.stopPropagation();
      handleSubmit();
    }
  };

  useEffect(() => {
    if (mode === 'add') {
      setFormData(initialFormData);
      setValidationErrors({});
    } else if (individual) {
      if (mode === 'renew') {
        // For renew mode, only set expiryDate and amount
        setFormData({
          ...initialFormData,
          expiryDate: individual.expiryDate ? new Date(individual.expiryDate) : null,
          amount: ''
        });
      } else {
        // For edit mode, set all fields
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
      PaperProps={{ 
        sx: { borderRadius: 2 },
        onKeyPress: handleKeyPress
      }}
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
                      error={!!validationErrors[field]}
                      helperText={validationErrors[field]}
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
                          renderInput={(params) => <TextField {...params} fullWidth required error={!!dateError} helperText={dateError} />}
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
                          name="expiryDate"
                          error={!!validationErrors.expiryDate}
                          helperText={validationErrors.expiryDate || `Current expiry: ${format(new Date(individual?.expiryDate), 'dd MMM yyyy')}`}
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
          {isRenewMode ? 'Renew' : isAddMode ? 'Add' : 'Save Changes'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

export default IndividualDialog; 