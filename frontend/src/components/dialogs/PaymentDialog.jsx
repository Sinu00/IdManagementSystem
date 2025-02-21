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
  CircularProgress
} from '@mui/material';
import { MonetizationOn as MonetizationIcon } from '@mui/icons-material';
import { format } from 'date-fns';

function PaymentDialog({ open, onClose, individual, onSubmit, error }) {
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
    if (value > individual.pendingAmount) {
      setPaymentError(`Amount cannot exceed pending amount of ${individual.pendingAmount} SAR`);
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
          <Typography variant="h6">Pay Pending Amount</Typography>
        </Stack>
      </DialogTitle>
      <DialogContent>
        <Box sx={{ mt: 2 }}>
          <Paper sx={{ p: 2, mb: 2, bgcolor: 'background.default' }}>
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <Typography variant="subtitle2" color="text.secondary">
                  Payment Details for {individual.name}
                </Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="body2" color="text.primary" gutterBottom>
                  Paid Amount: SAR {individual.totalPaidAmount || 0}
                </Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="body2" color="text.primary" gutterBottom>
                  Pending Amount: SAR {individual.pendingAmount || 0}
                </Typography>
              </Grid>
              <Grid item xs={12}>
                <Typography variant="caption" color="text.secondary">
                  Last updated by {individual?.lastUpdatedBy}
                  {individual?.lastUpdateDate && (
                    <>
                      {' '}on{' '}
                      {format(new Date(individual.lastUpdateDate), 'dd MMM yyyy')}
                    </>
                  )}
                </Typography>
              </Grid>
            </Grid>
          </Paper>

          <TextField
            fullWidth
            label="Payment Amount"
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
          Cancel
        </Button>
        <Button 
          onClick={handleSubmit}
          variant="contained" 
          color="primary"
          disabled={!paymentAmount || !!paymentError || isSubmitting}
          startIcon={isSubmitting ? <CircularProgress size={20} /> : <MonetizationIcon />}
        >
          {isSubmitting ? 'Processing...' : 'Make Payment'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

export default PaymentDialog; 