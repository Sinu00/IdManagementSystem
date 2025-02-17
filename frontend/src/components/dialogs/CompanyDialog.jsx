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
  Stack
} from '@mui/material';

function CompanyDialog({ open, onClose, onSubmit, company, mode, error }) {
  const [formData, setFormData] = useState({
    name: company?.name || '',
    address: company?.address || '',
    crNumber: company?.crNumber || '',
    sponserId: company?.sponserId || '',
    gosiNumber: company?.gosiNumber || '',
    makthabNumber: company?.makthabNumber || '',
    contactPerson: company?.contactPerson || '',
    contactNumber: company?.contactNumber || ''
  });

  useEffect(() => {
    if (company) {
      setFormData({
        name: company.name || '',
        address: company.address || '',
        crNumber: company.crNumber || '',
        sponserId: company.sponserId || '',
        gosiNumber: company.gosiNumber || '',
        makthabNumber: company.makthabNumber || '',
        contactPerson: company.contactPerson || '',
        contactNumber: company.contactNumber || ''
      });
    } else {
      setFormData({
        name: '',
        address: '',
        crNumber: '',
        sponserId: '',
        gosiNumber: '',
        makthabNumber: '',
        contactPerson: '',
        contactNumber: ''
      });
    }
  }, [company]);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>
        {mode === 'add' ? 'Add New Company' : 'Edit Company'}
      </DialogTitle>
      <form onSubmit={handleSubmit}>
        <DialogContent>
          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}
          <Stack spacing={2}>
            <TextField
              fullWidth
              label="Company Name"
              name="name"
              value={formData.name}
              onChange={handleChange}
              required
            />
            <TextField
              fullWidth
              label="Address"
              name="address"
              value={formData.address}
              onChange={handleChange}
              multiline
              rows={2}
            />
            <TextField
              fullWidth
              label="CR Number"
              name="crNumber"
              value={formData.crNumber}
              onChange={handleChange}
            />
            <TextField
              fullWidth
              label="Sponsor ID"
              name="sponserId"
              value={formData.sponserId}
              onChange={handleChange}
            />
            <TextField
              fullWidth
              label="GOSI Number"
              name="gosiNumber"
              value={formData.gosiNumber}
              onChange={handleChange}
            />
            <TextField
              fullWidth
              label="Makthab Number"
              name="makthabNumber"
              value={formData.makthabNumber}
              onChange={handleChange}
            />
            <TextField
              fullWidth
              label="Contact Person"
              name="contactPerson"
              value={formData.contactPerson}
              onChange={handleChange}
            />
            <TextField
              fullWidth
              label="Contact Number"
              name="contactNumber"
              value={formData.contactNumber}
              onChange={handleChange}
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={onClose}>Cancel</Button>
          <Button type="submit" variant="contained" color="primary">
            {mode === 'add' ? 'Add' : 'Save'}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
}

export default CompanyDialog; 