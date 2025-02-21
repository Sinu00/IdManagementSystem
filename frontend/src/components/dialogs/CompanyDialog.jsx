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
  Grid
} from '@mui/material';

function CompanyDialog({ open, onClose, onSubmit, company, mode = 'add', error }) {
  const [formData, setFormData] = useState({
    name: company?.name || '',
    crNumber: company?.crNumber || '',
    sponserId: company?.sponserId || '',
    gosiNumber: company?.gosiNumber || '',
    molNumber: company?.molNumber || '',
    makthabNumber: company?.makthabNumber || ''
  });

  useEffect(() => {
    if (mode === 'add') {
      setFormData({
        name: '',
        crNumber: '',
        sponserId: '',
        gosiNumber: '',
        molNumber: '',
        makthabNumber: ''
      });
    } else if (company) {
      setFormData({
        name: company.name || '',
        crNumber: company.crNumber || '',
        sponserId: company.sponserId || '',
        gosiNumber: company.gosiNumber || '',
        molNumber: company.molNumber || '',
        makthabNumber: company.makthabNumber || ''
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
    >
      <DialogTitle>
        {mode === 'add' ? 'Add Company' : 'Edit Company'}
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
                label="Company Name"
                name="name"
                value={formData.name}
                onChange={handleChange}
                required
                autoFocus
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="CR Number"
                name="crNumber"
                value={formData.crNumber}
                onChange={handleChange}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Sponsor ID"
                name="sponserId"
                value={formData.sponserId}
                onChange={handleChange}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="GOSI Number"
                name="gosiNumber"
                value={formData.gosiNumber}
                onChange={handleChange}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="MOL Number"
                name="molNumber"
                value={formData.molNumber}
                onChange={handleChange}
              />
            </Grid>
          </Grid>
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button 
          onClick={handleSubmit} 
          variant="contained" 
          color="primary"
          data-confirm-action="true"
        >
          {mode === 'add' ? 'Add' : 'Save Changes'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

export default CompanyDialog; 