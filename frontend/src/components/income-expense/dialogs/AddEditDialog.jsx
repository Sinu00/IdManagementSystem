import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert,
  Box,
  InputAdornment
} from '@mui/material';
import { useTranslation } from 'react-i18next';

const defaultFormData = {
  name: '',
  description: '',
  amount: '',
  iqamaNumber: '',
  referredBy: '',
  company: '',
  expenseType: 'other',
  specification: ''
};

const AddEditDialog = ({ 
  open, 
  onClose, 
  type, 
  onSubmit, 
  error,
  data = null,
  companies,
  iqamaPrice
}) => {
  const { t } = useTranslation();
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    amount: '',
    iqamaNumber: '',
    referredBy: '',
    company: '',
    expenseType: 'other',
    specification: ''
  });

  useEffect(() => {
    if (data) {
      setFormData({
        name: data.name || '',
        description: data.description || '',
        amount: data.amount?.toString() || '',
        iqamaNumber: data.iqamaNumber || '',
        referredBy: data.referredBy || '',
        company: data.company || '',
        expenseType: data.expenseType || 'other',
        specification: data.specification || ''
      });
    } else {
      setFormData({
        name: '',
        description: '',
        amount: '',
        iqamaNumber: '',
        referredBy: '',
        company: '',
        expenseType: 'other',
        specification: ''
      });
    }
  }, [data]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>
        {t(data ? 'dialog.edit' : 'dialog.add')} {t(`dialog.${type}`)}
      </DialogTitle>
      <form onSubmit={handleSubmit}>
        <DialogContent>
          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}
          
          {type === 'income' && (
            <>
              <TextField
                fullWidth
                label={t('form.incomeSource')}
                name="name"
                value={formData.name}
                onChange={handleChange}
                margin="normal"
                required
                helperText={t('form.incomeSourceHelperText')}
              />
              <TextField
                fullWidth
                label={t('form.description')}
                name="description"
                value={formData.description}
                onChange={handleChange}
                margin="normal"
                multiline
                rows={2}
                helperText={t('form.descriptionHelperText')}
              />
              <TextField
                fullWidth
                label={t('form.amount')}
                name="amount"
                type="number"
                value={formData.amount}
                onChange={handleChange}
                margin="normal"
                required
                InputProps={{
                  startAdornment: <InputAdornment position="start">SAR</InputAdornment>,
                }}
              />
            </>
          )}

          {type === 'expense' && (
            <>
              <FormControl fullWidth margin="normal">
                <InputLabel>{t('incomeExpense.dialog.fields.paidFor')}</InputLabel>
                <Select
                  value={formData.expenseType || 'other'}
                  onChange={(e) => setFormData({ ...formData, expenseType: e.target.value })}
                  label={t('incomeExpense.dialog.fields.paidFor')}
                  required
                >
                  <MenuItem value="cr">{t('incomeExpense.expense.types.cr')}</MenuItem>
                  <MenuItem value="qiwa">{t('incomeExpense.expense.types.qiwa')}</MenuItem>
                  <MenuItem value="muqeem">{t('incomeExpense.expense.types.muqeem')}</MenuItem>
                  <MenuItem value="saudi">{t('incomeExpense.expense.types.saudi')}</MenuItem>
                  <MenuItem value="efa">{t('incomeExpense.expense.types.efa')}</MenuItem>
                  <MenuItem value="other">{t('incomeExpense.expense.types.other')}</MenuItem>
                </Select>
              </FormControl>
              {formData.expenseType === 'other' && (
                <TextField
                  fullWidth
                  label={t('incomeExpense.dialog.fields.specifyOther')}
                  value={formData.specification || ''}
                  onChange={(e) => setFormData({ ...formData, specification: e.target.value })}
                  required
                  margin="normal"
                />
              )}
              <TextField
                fullWidth
                label={t('incomeExpense.dialog.fields.amount')}
                type="number"
                value={formData.amount || ''}
                onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                required
                margin="normal"
              />
            </>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={onClose}>{t('dialog.cancel')}</Button>
          <Button type="submit" variant="contained">
            {t(data ? 'dialog.save' : 'dialog.add')}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
};

export default AddEditDialog;