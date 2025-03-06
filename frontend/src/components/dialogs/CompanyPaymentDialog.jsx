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
  FormLabel,
  RadioGroup,
  FormControlLabel,
  Radio,
  Divider,
  InputAdornment,
  Paper,
  InputLabel,
  Select,
  MenuItem
} from '@mui/material';
import PaymentIcon from '@mui/icons-material/Payment';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import PendingIcon from '@mui/icons-material/Pending';
import CachedIcon from '@mui/icons-material/Cached';

function CompanyPaymentDialog({ open, onClose, onSubmit, company }) {
  const [paymentType, setPaymentType] = useState('qiwa');
  const [amount, setAmount] = useState(0);
  const [error, setError] = useState('');
  
  useEffect(() => {
    if (company) {
      // Set the default amount based on payment type
      switch (paymentType) {
        case 'qiwa':
          setAmount(company.qiwaAmount || 0);
          break;
        case 'muqeem':
          setAmount(company.muqeemAmount || 0);
          break;
        case 'efa':
          setAmount(company.efaAmount || 0);
          break;
        default:
          setAmount(0);
      }
    }
  }, [company, paymentType]);

  const handlePaymentTypeChange = (event) => {
    setPaymentType(event.target.value);
  };

  const handleAmountChange = (event) => {
    setAmount(event.target.value);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit({
      paymentType,
      paymentAmount: Number(amount)
    });
  };

  const isPaid = (type) => {
    switch (type) {
      case 'qiwa':
        return company?.qiwaAmount > 0;
      case 'muqeem':
        return company?.muqeemAmount > 0;
      case 'efa':
        return company?.efaAmount > 0;
      default:
        return false;
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
    >
      <DialogTitle>
        <Box display="flex" alignItems="center">
          <PaymentIcon sx={{ mr: 1 }} />
          Company Payments
        </Box>
      </DialogTitle>
      <DialogContent>
        {company && (
          <Box component="form" onSubmit={handleSubmit} sx={{ mt: 2 }}>
            {error && (
              <Alert severity="error" sx={{ mb: 2 }}>
                {error}
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
                    Current Payment Status
                  </Typography>
                  <Grid container spacing={2}>
                    <Grid item xs={6}>
                      <Typography variant="body2">
                        CR Amount: <strong>{company.crAmount} SAR</strong>
                      </Typography>
                    </Grid>
                    <Grid item xs={6}>
                      <Typography variant="body2">
                        Qiwa Amount: <strong>{company.qiwaAmount} SAR</strong>
                      </Typography>
                    </Grid>
                    <Grid item xs={6}>
                      <Typography variant="body2">
                        Muqeem Amount: <strong>{company.muqeemAmount} SAR</strong>
                      </Typography>
                    </Grid>
                    <Grid item xs={6}>
                      <Typography variant="body2">
                        EFA Amount: <strong>{company.efaAmount} SAR</strong>
                      </Typography>
                    </Grid>
                    <Grid item xs={12}>
                      <Divider sx={{ my: 1 }} />
                      <Typography variant="subtitle1" color="primary" fontWeight="bold">
                        Total Amount: <strong>{company.totalAmount} SAR</strong>
                      </Typography>
                    </Grid>
                  </Grid>
                </Paper>
              </Grid>
            </Grid>
            
            <FormControl fullWidth sx={{ mb: 2 }}>
              <InputLabel>Payment Type</InputLabel>
              <Select
                value={paymentType}
                onChange={handlePaymentTypeChange}
                label="Payment Type"
              >
                <MenuItem value="qiwa" disabled={isPaid('qiwa')}>
                  Qiwa Payment {isPaid('qiwa') ? '(Paid)' : ''}
                </MenuItem>
                <MenuItem value="muqeem" disabled={isPaid('muqeem')}>
                  Muqeem Payment {isPaid('muqeem') ? '(Paid)' : ''}
                </MenuItem>
                <MenuItem value="efa" disabled={isPaid('efa')}>
                  EFA Payment {isPaid('efa') ? '(Paid)' : ''}
                </MenuItem>
              </Select>
            </FormControl>
            
            <TextField
              fullWidth
              label="Payment Amount"
              type="number"
              value={amount}
              onChange={handleAmountChange}
              InputProps={{
                startAdornment: <InputAdornment position="start">SAR</InputAdornment>,
              }}
              sx={{ mb: 2 }}
            />
          </Box>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button 
          onClick={handleSubmit} 
          variant="contained" 
          color="primary"
          startIcon={<PaymentIcon />}
        >
          Process Payment
        </Button>
      </DialogActions>
    </Dialog>
  );
}

export default CompanyPaymentDialog; 