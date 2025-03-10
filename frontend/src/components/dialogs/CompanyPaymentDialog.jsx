import React from 'react';
import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  Box,
  Alert,
  Grid,
  Typography,
  FormControl,
  InputAdornment,
  Paper,
  InputLabel,
  Select,
  MenuItem
} from '@mui/material';
import PaymentIcon from '@mui/icons-material/Payment';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import PendingIcon from '@mui/icons-material/Pending';
import { expenseApi } from '../../services/api';
import { useTranslation } from 'react-i18next';

function CompanyPaymentDialog({ open, onClose, onSubmit, company }) {
  const { t } = useTranslation();
  const [formData, setFormData] = useState({
    paymentType: 'qiwa',
    amount: 0,
    paymentDate: new Date().toISOString().split('T')[0],
    error: ''
  });
  
  useEffect(() => {
    if (company) {
      // Set the default amount based on payment type
      setFormData(prevData => ({
        ...prevData,
        amount: company.qiwaAmount || 0
      }));
    }
  }, [company]);

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    try {
      // Create payment data with the specific amount field
      const paymentData = {
        paymentType: formData.paymentType,
        paymentAmount: parseFloat(formData.amount),
        paymentDate: formData.paymentDate
      };

      // Process the payment
      await onSubmit(paymentData);
      onClose();
    } catch (error) {
      console.error('Error processing payment:', error);
      setFormData(prevData => ({
        ...prevData,
        error: error.response?.data?.message || 'Failed to process payment'
      }));
    }
  };

  const getPaymentStatusLabel = (status) => {
    switch (status) {
      case 'none_paid':
        return { label: 'No Payments Made', color: 'error.main', icon: <PendingIcon /> };
      case 'partially_paid':
        return { label: 'Partially Paid', color: 'warning.main', icon: <CheckCircleIcon /> };
      case 'fully_paid':
        return { label: 'Fully Paid', color: 'success.main', icon: <CheckCircleIcon /> };
      default:
        return { label: 'Unknown', color: 'text.secondary', icon: <PendingIcon /> };
    }
  };

  const statusInfo = company ? getPaymentStatusLabel(company.paymentStatus) : null;

  return (
    <Dialog 
      open={open} 
      onClose={onClose} 
      maxWidth="sm" 
      fullWidth
      PaperProps={{ sx: { borderRadius: 2 } }}
      disableEnforceFocus
      disableRestoreFocus
    >
      <DialogTitle>
        <Box display="flex" alignItems="center">
          <PaymentIcon sx={{ mr: 1 }} />
          {t('dialogs.titles.processPayment')}
        </Box>
      </DialogTitle>
      <DialogContent>
        {company && (
          <Box component="form" onSubmit={handleFormSubmit} sx={{ mt: 2 }}>
            {formData.error && (
              <Alert severity="error" sx={{ mb: 2 }}>
                {formData.error}
              </Alert>
            )}
            
            <Typography variant="h6" gutterBottom>
              {company.name}
            </Typography>

            <Grid container spacing={2}>
              <Grid item xs={12}>
                <Paper 
                  sx={{ 
                    p: 2, 
                    bgcolor: 'background.default',
                    border: '1px solid',
                    borderColor: 'divider',
                    borderRadius: 2,
                    mb: 3
                  }}
                >
                  <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                    {t('common.currentStatus')}
                  </Typography>
                  <Grid container spacing={2}>
                    <Grid item xs={6}>
                      <Typography variant="body2">
                        {t('dialogs.payment.crAmount')}: <strong>{company.crAmount} SAR</strong>
                      </Typography>
                    </Grid>
                    <Grid item xs={6}>
                      <Typography variant="body2">
                        {t('dialogs.payment.qiwaAmount')}: <strong>{company.qiwaAmount} SAR</strong>
                      </Typography>
                    </Grid>
                    <Grid item xs={6}>
                      <Typography variant="body2">
                        {t('dialogs.payment.muqeemAmount')}: <strong>{company.muqeemAmount} SAR</strong>
                      </Typography>
                    </Grid>
                    <Grid item xs={6}>
                      <Typography variant="body2">
                        {t('dialogs.payment.efaAmount')}: <strong>{company.efaAmount} SAR</strong>
                      </Typography>
                    </Grid>
                  </Grid>
                </Paper>
              </Grid>
            </Grid>
            
            <FormControl fullWidth margin="normal">
              <InputLabel>{t('dialogs.payment.paymentType')}</InputLabel>
              <Select
                value={formData.paymentType}
                onChange={(e) => setFormData({ ...formData, paymentType: e.target.value })}
                label={t('dialogs.payment.paymentType')}
                required
              >
                <MenuItem value="qiwa">{t('dialogs.payment.qiwaAmount')}</MenuItem>
                <MenuItem value="muqeem">{t('dialogs.payment.muqeemAmount')}</MenuItem>
                <MenuItem value="efa">{t('dialogs.payment.efaAmount')}</MenuItem>
              </Select>
            </FormControl>
            
            <TextField
              fullWidth
              label={t('common.paymentAmount')}
              type="number"
              value={formData.amount}
              onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
              InputProps={{
                startAdornment: <InputAdornment position="start">SAR</InputAdornment>,
              }}
              sx={{ mb: 2 }}
            />
          </Box>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} color="inherit">
          {t('common.cancel')}
        </Button>
        <Button 
          onClick={handleFormSubmit} 
          variant="contained" 
          color="primary"
          startIcon={<PaymentIcon />}
          disabled={!formData.amount}
        >
          {t('common.submit')}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

export default CompanyPaymentDialog; 