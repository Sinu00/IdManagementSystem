import React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  CircularProgress
} from '@mui/material';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';

function ConfirmDialog({ open, onClose, onConfirm, title, message, messageData }) {
  const { t } = useTranslation();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleConfirm = async () => {
    try {
      setIsSubmitting(true);
      await onConfirm();
      onClose();
    } catch (error) {
      console.error('Confirmation action failed:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleKeyDown = async (event) => {
    if (event.key === 'Enter' && !isSubmitting) {
      event.preventDefault();
      event.stopPropagation();
      await handleConfirm();
    }
  };

  const translatedMessage = messageData ? t(message, messageData) : message;

  return (
    <Dialog 
      open={open} 
      onClose={onClose}
      PaperProps={{ 
        sx: { borderRadius: 2 },
        onKeyDown: handleKeyDown
      }}
    >
      <DialogTitle>
        {t('dialogs.confirm.title')}
      </DialogTitle>
      <DialogContent>
        <Typography>
          {translatedMessage}
        </Typography>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>
          {t('dialogs.confirm.cancel')}
        </Button>
        <Button 
          onClick={handleConfirm} 
          variant="contained" 
          color="primary"
          disabled={isSubmitting}
          data-confirm-action="true"
        >
          {isSubmitting ? t('dialogs.confirm.processing') : t('dialogs.confirm.confirm')}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

export default ConfirmDialog; 