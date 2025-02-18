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
import CustomDialog from './CustomDialog';

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
    <CustomDialog
      open={open}
      onClose={onClose}
      title={mode === 'add' ? 'Add New Company' : 'Edit Company'}
      onSubmit={handleSubmit}
      error={error}
      submitText={mode === 'add' ? 'Add Company' : 'Save Changes'}
      maxWidth="xs"
    >
      <TextField
        fullWidth
        label="Company Name"
        name="name"
        value={formData.name}
        onChange={handleChange}
        required
        size="medium"
        sx={{ 
          '& .MuiOutlinedInput-root': {
            borderRadius: 2,
            bgcolor: 'background.paper'
          }
        }}
      />
      <TextField
        fullWidth
        label="Address"
        name="address"
        value={formData.address}
        onChange={handleChange}
        required
        multiline
        rows={3}
        size="medium"
        sx={{ 
          '& .MuiOutlinedInput-root': {
            borderRadius: 2,
            bgcolor: 'background.paper'
          }
        }}
      />
      <TextField
        fullWidth
        label="CR Number"
        name="crNumber"
        value={formData.crNumber}
        onChange={handleChange}
        sx={{ 
          '& .MuiOutlinedInput-root': {
            borderRadius: 2,
            bgcolor: 'background.paper'
          }
        }}
      />
      <TextField
        fullWidth
        label="Sponsor ID"
        name="sponserId"
        value={formData.sponserId}
        onChange={handleChange}
        sx={{ 
          '& .MuiOutlinedInput-root': {
            borderRadius: 2,
            bgcolor: 'background.paper'
          }
        }}
      />
      <TextField
        fullWidth
        label="GOSI Number"
        name="gosiNumber"
        value={formData.gosiNumber}
        onChange={handleChange}
        sx={{ 
          '& .MuiOutlinedInput-root': {
            borderRadius: 2,
            bgcolor: 'background.paper'
          }
        }}
      />
      <TextField
        fullWidth
        label="Makthab Number"
        name="makthabNumber"
        value={formData.makthabNumber}
        onChange={handleChange}
        sx={{ 
          '& .MuiOutlinedInput-root': {
            borderRadius: 2,
            bgcolor: 'background.paper'
          }
        }}
      />
      <TextField
        fullWidth
        label="Contact Person"
        name="contactPerson"
        value={formData.contactPerson}
        onChange={handleChange}
        sx={{ 
          '& .MuiOutlinedInput-root': {
            borderRadius: 2,
            bgcolor: 'background.paper'
          }
        }}
      />
      <TextField
        fullWidth
        label="Contact Number"
        name="contactNumber"
        value={formData.contactNumber}
        onChange={handleChange}
        sx={{ 
          '& .MuiOutlinedInput-root': {
            borderRadius: 2,
            bgcolor: 'background.paper'
          }
        }}
      />
    </CustomDialog>
  );
}

export default CompanyDialog; 