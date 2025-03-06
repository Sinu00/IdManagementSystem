import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Typography,
  Box,
  IconButton,
  Tooltip
} from '@mui/material';
import { Clear as ClearIcon } from '@mui/icons-material';

function CompanySaudiPaymentDialog({ open, onClose, onSubmit, company }) {
  const [amount, setAmount] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!amount || isNaN(amount) || parseFloat(amount) <= 0) {
      setError('Please enter a valid amount');
      return;
    }
    onSubmit({ amount: parseFloat(amount) });
  };

  const handleClear = () => {
    onSubmit({ amount: 0, clear: true });
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>
        <Typography variant="h6" component="div">
          Saudi Payment for {company?.name}
        </Typography>
      </DialogTitle>
      <form onSubmit={handleSubmit}>
        <DialogContent>
          <Box sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 2 }}>
            <Box>
              <Typography variant="body2" color="text.secondary">
                Current Saudi Payment Count: {company?.saudiCount || 0}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Total Saudi Amount Paid: {company?.saudiAmount || 0} SAR
              </Typography>
            </Box>
            <Tooltip title="Clear Saudi Payment Records">
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
            autoFocus
            margin="dense"
            label="Amount (SAR)"
            type="number"
            fullWidth
            value={amount}
            onChange={(e) => {
              setAmount(e.target.value);
              setError('');
            }}
            error={!!error}
            helperText={error}
            required
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={onClose}>Cancel</Button>
          <Button 
            type="submit" 
            variant="contained" 
            color="primary"
            disabled={!amount || isNaN(amount) || parseFloat(amount) <= 0}
          >
            Submit Payment
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
}

export default CompanySaudiPaymentDialog; 