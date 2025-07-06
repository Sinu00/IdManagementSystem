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
  Autocomplete,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
} from '@mui/material';
import { LocalizationProvider, DatePicker } from '@mui/x-date-pickers';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { format } from 'date-fns';
import { MonetizationOn as MonetizationIcon } from '@mui/icons-material';
import { iqamaPriceApi, incomeApi } from '../../services/api';
import { useTranslation } from 'react-i18next';

function IndividualDialog({ open, onClose, individual, onSubmit, mode = 'add', error, referredByOptions = [] }) {
  const { t } = useTranslation();
  const initialFormData = {
    name: '',
    nationality: '',
    phoneNumber: '',
    iqamaNumber: '',
    description: '',
    expiryDate: null,
    amount: '',
    referredBy: '',
    customIqamaPrice: '',
    customPriceReason: '',
  };

  const [formData, setFormData] = useState(initialFormData);
  const [dateError, setDateError] = useState('');
  const [paymentError, setPaymentError] = useState('');
  const [currentIqamaPrice, setCurrentIqamaPrice] = useState(5000);
  const [validationErrors, setValidationErrors] = useState({});
  const [useCustomPrice, setUseCustomPrice] = useState(false);
  const [customPriceError, setCustomPriceError] = useState('');

  const isRenewMode = mode === 'renew';
  const isAddMode = mode === 'add';

  // Validation functions
  const validateIqamaNumber = (value) => {
    const numericValue = value.replace(/\D/g, '');
    if (numericValue.length !== 10) {
      return t('individual.errors.iqamaLength');
    }
    if (!/^\d+$/.test(numericValue)) {
      return t('individual.errors.iqamaNumbers');
    }
    return '';
  };

  const validatePhoneNumber = (value) => {
    const numericValue = value.replace(/\D/g, '');
    if (numericValue.length !== 10) {
      return t('individual.errors.phoneLength');
    }
    if (!/^\d+$/.test(numericValue)) {
      return t('individual.errors.phoneNumbers');
    }
    return '';
  };

  const validateCustomPrice = (value) => {
    const price = parseFloat(value);
    if (isNaN(price) || price < 1000 || price > 15000) {
      return 'Custom price must be between 1,000 and 15,000 SAR';
    }
    return '';
  };

  const validateName = (value) => {
    if (!value) return t('individual.errors.nameRequired');
    return '';
  };

  const getCurrentPrice = () => {
    if (useCustomPrice && formData.customIqamaPrice) {
      return parseFloat(formData.customIqamaPrice) || currentIqamaPrice;
    }
    return currentIqamaPrice;
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
    const currentPrice = getCurrentPrice();
    if (value > currentPrice) {
      setPaymentError(t('individual.errors.amountExceeded', { amount: currentPrice }));
    } else if (value < 0) {
      setPaymentError(t('individual.errors.validAmount'));
    } else {
      setPaymentError('');
    }
    setFormData(prev => ({
      ...prev,
      amount: e.target.value
    }));
  };

  const handleSubmit = async (e) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }

    let errors = {};
    
    if (isRenewMode) {
      if (!formData.expiryDate) {
        errors.expiryDate = t('individual.errors.expiryRequired');
      }
      if (!formData.amount) {
        errors.amount = t('individual.errors.paymentRequired');
      }
    } else {
      // Validation for add/edit mode
      if (!formData.name) {
        errors.name = t('individual.errors.nameRequired');
      }
      if (!formData.nationality) {
        errors.nationality = t('individual.errors.nationalityRequired');
      }
      if (!formData.iqamaNumber) {
        errors.iqamaNumber = t('individual.errors.iqamaRequired');
      } else {
        const iqamaError = validateIqamaNumber(formData.iqamaNumber);
        if (iqamaError) errors.iqamaNumber = iqamaError;
      }
      if (formData.phoneNumber) {
        const phoneError = validatePhoneNumber(formData.phoneNumber);
        if (phoneError) errors.phoneNumber = phoneError;
      }
      if (isAddMode && !formData.expiryDate) {
        errors.expiryDate = t('individual.errors.expiryRequired');
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

        // Add custom pricing data if using custom price
        if (useCustomPrice && formData.customIqamaPrice) {
          submitData.customIqamaPrice = parseFloat(formData.customIqamaPrice);
          submitData.customPriceReason = formData.customPriceReason;
        }

        // If there's a new referrer, add it to the options
        if (formData.referredBy && !referredByOptions.includes(formData.referredBy)) {
          referredByOptions.push(formData.referredBy);
        }
      } else {
        // For renew mode
        submitData = {
          expiryDate: formData.expiryDate,
          amount: parseFloat(formData.amount) || 0,
        };

        // Add custom pricing data if using custom price
        if (useCustomPrice && formData.customIqamaPrice) {
          submitData.customIqamaPrice = parseFloat(formData.customIqamaPrice);
          submitData.customPriceReason = formData.customPriceReason;
        }
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
    if (individual && !isAddMode) {
      const hasCustomPrice = individual.priceOverridden || false;
      setUseCustomPrice(hasCustomPrice);
      
      setFormData({
        name: individual.name || '',
        nationality: individual.nationality || '',
        phoneNumber: individual.phoneNumber || '',
        iqamaNumber: individual.iqamaNumber || '',
        description: individual.description || '',
        expiryDate: individual.expiryDate ? new Date(individual.expiryDate) : null,
        amount: individual.amount?.toString() || '',
        referredBy: individual.referredBy || '',
        customIqamaPrice: hasCustomPrice ? individual.iqamaPrice?.toString() || '' : '',
        customPriceReason: individual.customPriceReason || '',
      });
    } else {
      setFormData(initialFormData);
      setUseCustomPrice(false);
    }
  }, [individual, isAddMode]);

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
            {t('individual.renewalInfo')} {individual?.name}
          </Typography>
        </Grid>
        <Grid item xs={12}>
          <Typography variant="body2" color="text.secondary">
            {t('individual.fullIqamaAmount')}: {currentIqamaPrice} SAR
          </Typography>
          {individual?.lastUpdatedBy && (
            <Typography variant="caption" color="text.secondary" display="block" sx={{ mt: 1 }}>
              {t('individual.lastUpdatedBy')} {individual.lastUpdatedBy}
              {individual.lastUpdateDate && ` ${t('individual.lastUpdateDate')} ${format(new Date(individual.lastUpdateDate), 'dd MMM yyyy')}`}
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
      disableEnforceFocus
      disableRestoreFocus
    >
      <DialogTitle>
        {t(`dialogs.titles.${mode === 'add' ? 'addIndividual' : mode === 'edit' ? 'editIndividual' : 'renewIndividual'}`)}
      </DialogTitle>
      <DialogContent>
        <Box sx={{ pt: 2 }}>
          {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
          {isRenewMode && renderRenewalInfo()}

          <Box component="form" onSubmit={handleSubmit} sx={{ mt: 2 }}>
            {!isRenewMode && (
              <Grid container spacing={2}>
                {['name', 'nationality', 'phoneNumber', 'iqamaNumber'].map((field) => (
                  <Grid item xs={12} sm={6} key={field}>
                    <TextField
                      fullWidth
                      label={t(`individual.${field}`)}
                      name={field}
                      value={formData[field]}
                      onChange={handleChange}
                      required={['name', 'nationality', 'iqamaNumber'].includes(field)}
                      error={!!validationErrors[field]}
                      helperText={validationErrors[field]}
                      placeholder={t(`individual.placeholders.${field}`)}
                    />
                  </Grid>
                ))}
                
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label={t('individual.description')}
                    name="description"
                    value={formData.description}
                    onChange={handleChange}
                    multiline
                    rows={3}
                    placeholder={t('individual.placeholders.description')}
                  />
                </Grid>

                {isAddMode && (
                  <>
                    <Grid item xs={12} sm={6}>
                      <LocalizationProvider dateAdapter={AdapterDateFns}>
                        <DatePicker
                          label={t('individual.expiryDate')}
                          value={formData.expiryDate}
                          onChange={(newValue) => setFormData(prev => ({ ...prev, expiryDate: newValue }))}
                          renderInput={(params) => (
                            <TextField 
                              {...params} 
                              fullWidth 
                              required 
                              error={!!dateError} 
                              helperText={dateError}
                              placeholder={t('individual.placeholders.expiryDate')}
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
                        label={t('common.paymentAmount')}
                        name="amount"
                        type="number"
                        value={formData.amount}
                        onChange={handlePaymentChange}
                        required
                        error={!!paymentError}
                        helperText={paymentError || t('individual.remainingAmount', { amount: getCurrentPrice() - (parseFloat(formData.amount) || 0) })}
                        inputProps={{
                          min: 0,
                          max: getCurrentPrice(),
                          step: "0.01"
                        }}
                        placeholder={t('individual.placeholders.amount')}
                      />
                    </Grid>
                  </>
                )}

                {/* Custom Pricing Section */}
                {(isAddMode || isRenewMode) && (
                  <>
                    <Grid item xs={12}>
                      <Box sx={{ mt: 1, mb: 1 }}>
                        <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                          Default iqama Price: {currentIqamaPrice} SAR
                        </Typography>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <input
                            type="checkbox"
                            id="useCustomPrice"
                            checked={useCustomPrice}
                            onChange={(e) => {
                              setUseCustomPrice(e.target.checked);
                              if (!e.target.checked) {
                                setFormData(prev => ({ ...prev, customIqamaPrice: '', customPriceReason: '' }));
                                setCustomPriceError('');
                              }
                            }}
                          />
                          <label htmlFor="useCustomPrice">
                            <Typography variant="body2">
                              Use custom iqama price
                            </Typography>
                          </label>
                        </Box>
                      </Box>
                    </Grid>
                    
                    {useCustomPrice && (
                      <>
                        <Grid item xs={12} sm={6}>
                          <TextField
                            fullWidth
                            label="Custom Iqama Price (SAR)"
                            name="customIqamaPrice"
                            type="number"
                            value={formData.customIqamaPrice}
                            onChange={(e) => {
                              const value = e.target.value;
                              const error = value ? validateCustomPrice(value) : '';
                              setCustomPriceError(error);
                              setFormData(prev => ({ ...prev, customIqamaPrice: value }));
                            }}
                            error={!!customPriceError}
                            helperText={customPriceError || 'Enter amount between 1,000 and 15,000 SAR'}
                            inputProps={{
                              min: 1000,
                              max: 15000,
                              step: "1"
                            }}
                          />
                        </Grid>
                        <Grid item xs={12} sm={6}>
                          <TextField
                            fullWidth
                            label="Reason for Custom Price"
                            name="customPriceReason"
                            value={formData.customPriceReason}
                            onChange={(e) => setFormData(prev => ({ ...prev, customPriceReason: e.target.value }))}
                            placeholder="Optional: Why is this price different?"
                            multiline
                            rows={2}
                          />
                        </Grid>
                      </>
                    )}
                  </>
                )}

                <Grid item xs={12} sm={6}>
                  <FormControl fullWidth>
                    <InputLabel>{t('individual.referredBy')}</InputLabel>
                    <Select
                      value={formData.referredBy || ''}
                      onChange={handleChange}
                      name="referredBy"
                      label={t('individual.referredBy')}
                    >
                      {referredByOptions.map((option) => (
                        <MenuItem key={option} value={option}>
                          {option}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
              </Grid>
            )}

            {isRenewMode && (
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <LocalizationProvider dateAdapter={AdapterDateFns}>
                    <DatePicker
                      label={t('individual.newExpiryDate')}
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
                          helperText={validationErrors.expiryDate || t('individual.currentExpiry', { date: format(new Date(individual?.expiryDate), 'dd MMM yyyy') })}
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
                    label={t('common.paymentAmount')}
                    name="amount"
                    type="number"
                    value={formData.amount}
                    onChange={handlePaymentChange}
                    required
                    error={!!paymentError}
                    helperText={paymentError || t('individual.remainingAmount', { amount: getCurrentPrice() - (parseFloat(formData.amount) || 0) })}
                    inputProps={{
                      min: 0,
                      max: getCurrentPrice(),
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
        <Button onClick={onClose}>{t('common.cancel')}</Button>
        <Button 
          onClick={handleSubmit} 
          variant="contained" 
          color="primary"
          startIcon={isRenewMode ? <MonetizationIcon /> : undefined}
          disabled={!!paymentError}
        >
          {isRenewMode ? t('common.renew') : isAddMode ? t('common.submit') : t('common.edit')}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

export default IndividualDialog; 