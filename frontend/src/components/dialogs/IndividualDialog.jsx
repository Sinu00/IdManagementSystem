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
  Alert,
  Stack,
  Grid
} from '@mui/material';
import { LocalizationProvider, DatePicker } from '@mui/x-date-pickers';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { format } from 'date-fns';

function IndividualDialog({ open, onClose, individual, onSubmit, mode = 'add', error }) {
  const initialFormData = {
    name: '',
    nationality: '',
    phoneNumber: '',
    iqamaNumber: '',
    expiryDate: null,
    referredBy: '',
    amount: '0',
  };

  const [formData, setFormData] = useState(initialFormData);

  useEffect(() => {
    if (mode === 'add') {
      setFormData(initialFormData);
    } else if (individual) {
      setFormData({
        name: individual.name || '',
        nationality: individual.nationality || '',
        phoneNumber: individual.phoneNumber || '',
        iqamaNumber: individual.iqamaNumber || '',
        expiryDate: individual.expiryDate ? new Date(individual.expiryDate) : null,
        referredBy: individual.referredBy || '',
        amount: individual.amount ? individual.amount.toString() : '0'
      });
    }
  }, [individual, mode]);

  const handleSubmit = (e) => {
    e.preventDefault();
    const submissionData = {
      ...formData,
      amount: parseFloat(formData.amount) || 0,
      referredBy: formData.referredBy || ''
    };
    onSubmit(submissionData);
  };

  const isRenewMode = mode === 'renew';
  const isEditMode = mode === 'edit';
  const isAddMode = mode === 'add';

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
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
        }
      }}
    >
      <DialogTitle>
        {mode === 'add' ? 'Add Individual' : mode === 'edit' ? 'Edit Individual' : 'Renew ID'}
      </DialogTitle>
      <DialogContent>
        <Box sx={{ pt: 2 }}>
          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}

          {(mode === 'edit' || mode === 'renew') && individual?.lastRenewedBy && (
            <Box 
              sx={{ 
                mb: 3, 
                p: 2, 
                bgcolor: 'grey.50', 
                borderRadius: 1,
                border: '1px solid',
                borderColor: 'divider'
              }}
            >
              <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                ID Information
              </Typography>
              <Stack spacing={1}>
                <Typography variant="body2">
                  Last renewed by: {individual.lastRenewedBy?.username || 'N/A'}
                </Typography>
                {individual.lastRenewalDate && (
                  <Typography variant="body2">
                    Renewal date: {format(new Date(individual.lastRenewalDate), 'dd/MM/yyyy')}
                  </Typography>
                )}
              </Stack>
            </Box>
          )}

          <Box component="form" onSubmit={handleSubmit} sx={{ mt: 2 }}>
            {!isRenewMode && (
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Name"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    required
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Nationality"
                    name="nationality"
                    value={formData.nationality}
                    onChange={handleChange}
                    required
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Phone Number"
                    name="phoneNumber"
                    value={formData.phoneNumber}
                    onChange={handleChange}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Iqama Number"
                    name="iqamaNumber"
                    value={formData.iqamaNumber}
                    onChange={handleChange}
                    required
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Referred By"
                    name="referredBy"
                    value={formData.referredBy}
                    onChange={handleChange}
                  />
                </Grid>

                {isAddMode && (
                  <>
                    <Grid item xs={12} sm={6}>
                      <LocalizationProvider dateAdapter={AdapterDateFns}>
                        <DatePicker
                          label="Expiry Date"
                          value={formData.expiryDate}
                          onChange={(newValue) => {
                            setFormData(prev => ({ ...prev, expiryDate: newValue }));
                          }}
                          renderInput={(params) => (
                            <TextField {...params} fullWidth required />
                          )}
                        />
                      </LocalizationProvider>
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <TextField
                        fullWidth
                        label="Amount (SAR)"
                        name="amount"
                        type="number"
                        value={formData.amount}
                        onChange={handleChange}
                        required
                      />
                    </Grid>
                  </>
                )}
              </Grid>
            )}

            {isRenewMode && (
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <LocalizationProvider dateAdapter={AdapterDateFns}>
                    <DatePicker
                      label="Expiry Date"
                      value={formData.expiryDate}
                      onChange={(newValue) => {
                        setFormData(prev => ({ ...prev, expiryDate: newValue }));
                      }}
                      renderInput={(params) => (
                        <TextField {...params} fullWidth required />
                      )}
                    />
                  </LocalizationProvider>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Amount (SAR)"
                    name="amount"
                    type="number"
                    value={formData.amount}
                    onChange={handleChange}
                    required
                  />
                </Grid>
              </Grid>
            )}
          </Box>
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button onClick={handleSubmit} variant="contained" color="primary">
          {mode === 'add' ? 'Add' : mode === 'edit' ? 'Save Changes' : 'Renew'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

export default IndividualDialog; 