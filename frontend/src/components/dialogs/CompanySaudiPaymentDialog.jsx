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
  Paper,
  InputAdornment,
  IconButton,
  Tooltip
} from '@mui/material';
import PaymentIcon from '@mui/icons-material/Payment';
import { Clear as ClearIcon } from '@mui/icons-material';
import { expenseApi } from '../../services/api';
import { useTranslation } from 'react-i18next';

function CompanySaudiPaymentDialog({ open, onClose, onSubmit, company }) {
  const { t } = useTranslation();
  const [formData, setFormData] = useState({
    amount: 0,
    paymentDate: new Date().toISOString().split('T')[0],
    error: ''
  });
  
  useEffect(() => {
    if (company) {
      setFormData(prevData => ({
        ...prevData,
        amount: company.saudiAmount || 0
      }));
    }
  }, [company]);

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    try {
      const paymentData = {
        amount: parseFloat(formData.amount),
        paymentDate: formData.paymentDate
      };

      // Process the payment
      await onSubmit(paymentData);
      onClose();
    } catch (error) {
      console.error('Error processing Saudi payment:', error);
      setFormData(prevData => ({
        ...prevData,
        error: error.response?.data?.message || 'Failed to process Saudi payment'
      }));
    }
  };

  const handleClear = () => {
    onSubmit({ amount: 0, clear: true });
  };

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
          {t('dialogs.titles.saudiPayment')}
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

            <Box sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 2 }}>
              <Box>
                <Typography variant="body2" color="text.secondary">
                  {t('dialogs.payment.currentCount')}: {company?.saudiCount || 0}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {t('common.totalAmount')}: {company?.saudiAmount || 0} SAR
                </Typography>
              </Box>
              <Tooltip title={t('dialogs.payment.clearRecords')}>
                <IconButton 
                  onClick={handleClear}
                  color="error"
                  size="small"
                  sx={{ 
                    bgcolor: 'error.lighter',
                    '&:hover': {
                      bgcolor: 'error.light'
                    }
                  }}
                >
                  <ClearIcon />
                </IconButton>
              </Tooltip>
            </Box>
            
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

export default CompanySaudiPaymentDialog; 