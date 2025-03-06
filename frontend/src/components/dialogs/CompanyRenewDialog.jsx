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

function CompanyRenewDialog({ open, onClose, onSubmit, company }) {
  const [amount, setAmount] = useState(company?.crAmount || 0);

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit({
      paymentType: 'renew',
      paymentAmount: Number(amount),
      resetPayments: true
    });
  };

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
          <CachedIcon sx={{ mr: 1 }} />
          Renew Company
        </Box>
      </DialogTitle>
      <DialogContent>
        {company && (
          <Box component="form" onSubmit={handleSubmit} sx={{ mt: 2 }}>
            <Typography variant="h6" gutterBottom>
              {company.name}
            </Typography>
            
            <Alert severity="warning" sx={{ mb: 2 }}>
              By renewing this company, all payment amounts will be reset to 0 and the payment status will be set to "none_paid".
            </Alert>
            
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
            
            <TextField
              fullWidth
              label="CR Renewal Amount"
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
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
          startIcon={<CachedIcon />}
        >
          Renew Company
        </Button>
      </DialogActions>
    </Dialog>
  );
}

export default CompanyRenewDialog; 