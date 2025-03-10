import React from 'react';
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
  Paper,
  Grid,
  Stack,
  CircularProgress,
  Alert
} from '@mui/material';
import { MonetizationOn as MonetizationIcon } from '@mui/icons-material';
import { format } from 'date-fns';
import { useTranslation } from 'react-i18next';

function PaymentDialog({ open, onClose, individual, onSubmit, error }) {
  const { t } = useTranslation();
  const [paymentAmount, setPaymentAmount] = useState('');
  const [paymentError, setPaymentError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (open) {
      const timer = setTimeout(() => {
        const paymentInput = document.querySelector('input[name="paymentAmount"]');
        if (paymentInput) {
          paymentInput.focus();
        }
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [open]);

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && paymentAmount && !paymentError && !isSubmitting) {
      e.preventDefault();
      e.stopPropagation();
      handleSubmit();
    }
  };

  if (!individual) {
    return null;
  }

  const handleSubmit = async () => {
    try {
      setIsSubmitting(true);
      await onSubmit(parseFloat(paymentAmount));
      handleClose();
    } catch (error) {
      setPaymentError(error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setPaymentAmount('');
    setPaymentError('');
    onClose();
  };

  const handlePaymentChange = (e) => {
    const value = parseFloat(e.target.value);
    const pendingAmount = individual.pendingAmount || individual.iqamaPrice;
    if (value > pendingAmount) {
      setPaymentError(`Amount cannot exceed pending amount of ${pendingAmount} SAR`);
    } else if (value < 0) {
      setPaymentError('Please enter a valid amount');
    } else {
      setPaymentError('');
    }
    setPaymentAmount(e.target.value);
  };

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      maxWidth="sm"
      fullWidth
      PaperProps={{ 
        sx: { borderRadius: 2 },
        onKeyPress: handleKeyPress
      }}
    >
      <DialogTitle>
        <Stack direction="row" alignItems="center" spacing={1}>
          <MonetizationIcon color="primary" />
          <Typography variant="h6">{t('dialogs.titles.processPayment')}</Typography>
        </Stack>
      </DialogTitle>
      <DialogContent>
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}
        <Box sx={{ mt: 2 }}>
          <Paper sx={{ p: 2, mb: 2, bgcolor: 'background.default' }}>
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <Typography variant="subtitle2" color="text.secondary">
                  {t('individual.iqamaNumber')}: {individual.iqamaNumber}
                </Typography>
              </Grid>
              <Grid item xs={12}>
                <Typography variant="subtitle2" color="text.secondary">
                  {t('individual.name')}: {individual.name}
                </Typography>
              </Grid>
              <Grid item xs={12}>
                <Typography variant="subtitle2" color="text.secondary">
                  {t('individual.iqamaPrice')}: {individual.iqamaPrice} SAR
                </Typography>
              </Grid>
              <Grid item xs={12}>
                <Typography variant="subtitle2" color="text.secondary">
                  {t('individual.pendingAmount')}: {individual.pendingAmount} SAR
                </Typography>
              </Grid>
              <Grid item xs={12}>
                <Typography variant="caption" color="text.secondary">
                  {t('individual.lastUpdatedBy')} {individual?.lastUpdatedBy}
                  {individual?.lastUpdateDate && (
                    <>
                      {' '}{t('individual.lastUpdateDate')} {format(new Date(individual.lastUpdateDate), 'dd MMM yyyy')}
                    </>
                  )}
                </Typography>
              </Grid>
            </Grid>
          </Paper>

          <TextField
            fullWidth
            label={t('dialogs.payment.amount')}
            type="number"
            name="paymentAmount"
            value={paymentAmount}
            onChange={handlePaymentChange}
            margin="normal"
            error={!!paymentError}
            helperText={paymentError}
            inputProps={{
              max: individual.pendingAmount,
              min: 0,
              step: "0.01"
            }}
            disabled={isSubmitting}
          />
        </Box>
      </DialogContent>
      <DialogActions sx={{ p: 2, bgcolor: 'background.default' }}>
        <Button 
          onClick={handleClose}
          disabled={isSubmitting}
        >
          {t('common.cancel')}
        </Button>
        <Button 
          onClick={handleSubmit}
          variant="contained" 
          color="primary"
          disabled={!paymentAmount || !!paymentError || isSubmitting}
          startIcon={isSubmitting ? <CircularProgress size={20} /> : <MonetizationIcon />}
        >
          {isSubmitting ? t('dialogs.payment.processing') : t('common.submit')}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

export default PaymentDialog; 