import React from 'react';
import { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
  Paper,
  Grid,
  InputAdornment,
  TextField,
  Alert,
  Divider
} from '@mui/material';
import CachedIcon from '@mui/icons-material/Cached';
import { useTranslation } from 'react-i18next';

function CompanyRenewDialog({ open, onClose, onSubmit, company }) {
  const { t } = useTranslation();
  const [amount, setAmount] = useState(company?.crAmount || 0);
  const [error, setError] = useState('');

  React.useEffect(() => {
    if (open) {
      setAmount('');
    }
  }, [open]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      // Create payment data for renewal
      const paymentData = {
        paymentType: 'cr',
        paymentAmount: Number(amount),
        expenseType: 'cr',
        amount: Number(amount),
        isRenewal: true,
        resetPayments: true
      };

      // Process the renewal payment
      await onSubmit(paymentData);

      onClose();
    } catch (error) {
      console.error('Error processing renewal:', error);
      setError(error.response?.data?.message || 'Failed to process renewal');
    }
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
          <CachedIcon sx={{ mr: 1 }} />
          {t('dialogs.titles.renewCompany')}
        </Box>
      </DialogTitle>
      <DialogContent>
        {company && (
          <Box component="form" onSubmit={handleSubmit} sx={{ mt: 2 }}>
            <Typography variant="h6" gutterBottom>
              {company.name}
            </Typography>
            
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
                <Grid item xs={12}>
                  <Divider sx={{ my: 1 }} />
                  <Typography variant="subtitle1" color="primary" fontWeight="bold">
                    {t('common.totalAmount')}: <strong>{company.totalAmount} SAR</strong>
                  </Typography>
                </Grid>
              </Grid>
            </Paper>
            
            <TextField
              fullWidth
              label={t('common.paymentAmount')}
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              InputProps={{
                startAdornment: <InputAdornment position="start">SAR</InputAdornment>,
              }}
              sx={{ mb: 2 }}
              required
            />
          </Box>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} color="inherit">
          {t('common.cancel')}
        </Button>
        <Button 
          onClick={handleSubmit} 
          variant="contained" 
          color="primary"
          startIcon={<CachedIcon />}
          disabled={!amount}
        >
          {t('common.submit')}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

export default CompanyRenewDialog; 