import React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  Box
} from '@mui/material';
import { useTranslation } from 'react-i18next';

function IqamaPriceDialog({ open, onClose, onSubmit, currentPrice }) {
  const { t } = useTranslation();
  const [price, setPrice] = React.useState(currentPrice || '');

  React.useEffect(() => {
    if (open) {
      setPrice(currentPrice || '');
    }
  }, [open, currentPrice]);

  const handleSubmit = () => {
    onSubmit(Number(price));
  };

  return (
    <Dialog 
      open={open} 
      onClose={onClose}
      maxWidth="sm"
      fullWidth
    >
      <DialogTitle>
        {t('dialogs.iqamaPrice.title')}
      </DialogTitle>
      <DialogContent>
        <Box sx={{ mt: 2 }}>
          <TextField
            fullWidth
            label={t('dialogs.iqamaPrice.price')}
            type="number"
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            required
          />
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} color="inherit">
          {t('dialogs.iqamaPrice.cancel')}
        </Button>
        <Button 
          onClick={handleSubmit} 
          variant="contained" 
          color="primary"
          disabled={!price}
        >
          {t('dialogs.iqamaPrice.submit')}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

export default IqamaPriceDialog; 