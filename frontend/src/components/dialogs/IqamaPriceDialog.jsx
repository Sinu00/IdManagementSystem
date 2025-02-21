import { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Typography,
  Stack,
  CircularProgress
} from '@mui/material';
import { MonetizationOn as MonetizationIcon } from '@mui/icons-material';

function IqamaPriceDialog({ open, onClose, currentPrice, onSubmit }) {
  const [price, setPrice] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    try {
      setIsSubmitting(true);
      await onSubmit(parseFloat(price));
      handleClose();
    } catch (error) {
      setError(error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setPrice('');
    setError('');
    onClose();
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="xs" fullWidth>
      <DialogTitle>
        <Stack direction="row" alignItems="center" spacing={1}>
          <MonetizationIcon color="primary" />
          <Typography variant="h6">Update IQAMA Price</Typography>
        </Stack>
      </DialogTitle>
      <DialogContent>
        <Stack spacing={2} sx={{ mt: 2 }}>
          <Typography variant="body2" color="text.secondary">
            Current IQAMA Price: SAR {currentPrice}
          </Typography>
          <TextField
            fullWidth
            label="New IQAMA Price (SAR)"
            type="number"
            value={price}
            onChange={(e) => {
              const value = parseFloat(e.target.value);
              if (value <= 0) {
                setError('Please enter a valid amount');
              } else {
                setError('');
              }
              setPrice(e.target.value);
            }}
            error={!!error}
            helperText={error}
            inputProps={{ min: 0, step: "0.01" }}
            disabled={isSubmitting}
          />
        </Stack>
      </DialogContent>
      <DialogActions sx={{ p: 2 }}>
        <Button onClick={handleClose} disabled={isSubmitting}>
          Cancel
        </Button>
        <Button
          onClick={handleSubmit}
          variant="contained"
          color="primary"
          disabled={!price || !!error || isSubmitting}
          startIcon={isSubmitting ? <CircularProgress size={20} /> : <MonetizationIcon />}
        >
          {isSubmitting ? 'Updating...' : 'Update Price'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

export default IqamaPriceDialog; 