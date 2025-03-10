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
  InputAdornment
} from '@mui/material';
import { useTranslation } from 'react-i18next';

function CompanyDialog({ open, onClose, onSubmit, company, mode = 'add', error }) {
  const { t } = useTranslation();
  const [formData, setFormData] = useState({
    name: company?.name || '',
    crNumber: company?.crNumber || '',
    sponserId: company?.sponserId || '',
    gosiNumber: company?.gosiNumber || '',
    molNumber: company?.molNumber || '',
    makthabNumber: company?.makthabNumber || '',
    crAmount: company?.crAmount || 0
  });

  useEffect(() => {
    if (mode === 'add') {
      setFormData({
        name: '',
        crNumber: '',
        sponserId: '',
        gosiNumber: '',
        molNumber: '',
        makthabNumber: '',
        crAmount: 0
      });
    } else if (company) {
      setFormData({
        name: company.name || '',
        crNumber: company.crNumber || '',
        sponserId: company.sponserId || '',
        gosiNumber: company.gosiNumber || '',
        molNumber: company.molNumber || '',
        makthabNumber: company.makthabNumber || '',
        crAmount: company.crAmount || 0
      });
    }
  }, [company, mode]);

  // Focus first input when dialog opens
  useEffect(() => {
    if (open) {
      const timer = setTimeout(() => {
        const nameInput = document.querySelector('input[name="name"]');
        if (nameInput) {
          nameInput.focus();
        }
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [open]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(formData);
  };

  // Handle Enter key press
  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      e.stopPropagation();
      handleSubmit(e);
    }
  };

  return (
    <Dialog 
      open={open} 
      onClose={onClose} 
      maxWidth="sm" 
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 2
        },
        onKeyPress: handleKeyPress
      }}
      disableEnforceFocus
      disableRestoreFocus
    >
      <DialogTitle>
        {mode === 'add' ? t('dialogs.titles.addCompany') : t('dialogs.titles.editCompany')}
      </DialogTitle>
      <DialogContent>
        <Box component="form" onSubmit={handleSubmit} sx={{ mt: 2 }}>
          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}
          
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label={t('company.name')}
                name="name"
                value={formData.name}
                onChange={handleChange}
                required
                autoFocus
                inputProps={{
                  dir: 'rtl'
                }}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label={t('company.cr')}
                name="crNumber"
                value={formData.crNumber}
                onChange={handleChange}
                required
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label={t('company.sponsor')}
                name="sponserId"
                value={formData.sponserId}
                onChange={handleChange}
                required
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label={t('company.gosi')}
                name="gosiNumber"
                value={formData.gosiNumber}
                onChange={handleChange}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label={t('company.mol')}
                name="molNumber"
                value={formData.molNumber}
                onChange={handleChange}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label={t('dialogs.payment.crAmount')}
                name="crAmount"
                type="number"
                value={formData.crAmount}
                onChange={handleChange}
                InputProps={{
                  startAdornment: <InputAdornment position="start">SAR</InputAdornment>,
                }}
              />
            </Grid>
          </Grid>
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} color="inherit">
          {t('common.cancel')}
        </Button>
        <Button 
          onClick={handleSubmit} 
          variant="contained" 
          color="primary"
          data-confirm-action="true"
        >
          {t('common.save')}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

export default CompanyDialog; 