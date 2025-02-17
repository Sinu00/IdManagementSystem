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
  Stack
} from '@mui/material';
import { LocalizationProvider, DatePicker } from '@mui/x-date-pickers';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';

function IndividualDialog({ open, onClose, individual, onSubmit, mode = 'add', error }) {
  const [formData, setFormData] = useState({
    name: '',
    nationality: '',
    phoneNumber: '',
    iqamaNumber: '',
    expiryDate: null,
    notes: ''
  });

  useEffect(() => {
    if (individual) {
      setFormData({
        name: individual.name || '',
        nationality: individual.nationality || '',
        phoneNumber: individual.phoneNumber || '',
        iqamaNumber: individual.iqamaNumber || '',
        expiryDate: individual.expiryDate ? new Date(individual.expiryDate) : null,
        notes: individual.notes || ''
      });
    }
  }, [individual]);

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(formData);
  };

  const isRenewMode = mode === 'renew';

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
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
        {mode === 'add' && 'Add New Individual'}
        {mode === 'edit' && 'Edit Individual'}
        {mode === 'renew' && 'Renew Individual ID'}
      </DialogTitle>
      <form onSubmit={handleSubmit}>
        <DialogContent>
          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            {!isRenewMode && (
              <>
                <TextField
                  label="Name"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  required
                  disabled={isRenewMode}
                  error={!!error && error.includes('name')}
                />
                <TextField
                  label="Nationality"
                  value={formData.nationality}
                  onChange={(e) => setFormData({ ...formData, nationality: e.target.value })}
                  required
                  disabled={isRenewMode}
                />
                <TextField
                  label="Phone Number"
                  value={formData.phoneNumber}
                  onChange={(e) => setFormData({ ...formData, phoneNumber: e.target.value })}
                  disabled={isRenewMode}
                />
                <TextField
                  label="Iqama Number"
                  name="iqamaNumber"
                  value={formData.iqamaNumber}
                  onChange={handleChange}
                  required
                  disabled={isRenewMode}
                  error={!!error && error.includes('Iqama')}
                />
              </>
            )}
            
            <LocalizationProvider dateAdapter={AdapterDateFns}>
              <DatePicker
                label="Expiry Date"
                value={formData.expiryDate}
                onChange={(newValue) => setFormData({ ...formData, expiryDate: newValue })}
                renderInput={(params) => <TextField {...params} required />}
              />
            </LocalizationProvider>

            {!isRenewMode && (
              <TextField
                label="Notes"
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                multiline
                rows={3}
                disabled={isRenewMode}
              />
            )}
          </Box>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 3 }}>
          <Button onClick={onClose} variant="outlined">
            Cancel
          </Button>
          <Button type="submit" variant="contained">
            {mode === 'add' && 'Create'}
            {mode === 'edit' && 'Update'}
            {mode === 'renew' && 'Renew'}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
}

export default IndividualDialog; 