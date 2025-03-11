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
  Box
} from '@mui/material';
import { useTranslation } from 'react-i18next';

const defaultFormData = {
  name: '',
  amount: '',
  iqamaNumber: '',
  expenseType: 'other',
  specification: ''
};

const AddEditDialog = ({ 
  open, 
  onClose, 
  type, 
  onSubmit, 
  error,
  data = null
}) => {
  const { t } = useTranslation();
  const [formData, setFormData] = useState(data || defaultFormData);

  useEffect(() => {
    // Reset form data when dialog opens/closes or type changes
    if (open) {
      setFormData(data || {
        ...defaultFormData,
        name: type === 'expense' ? 'General Purpose' : '',
      });
    }
  }, [open, type, data]);

  const handleSubmit = (e) => {
    e.preventDefault();
    const submissionData = type === 'expense' 
      ? {
          ...formData,
          expenseType: formData.expenseType || 'other',
          specification: formData.expenseType === 'other' ? formData.specification : formData.expenseType,
        }
      : formData;

    onSubmit(submissionData);
  };

  const handleClose = () => {
    setFormData(defaultFormData);
    onClose();
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <DialogTitle>
        {type === 'income'
          ? t('incomeExpense.dialog.add.income')
          : t('incomeExpense.dialog.add.expense')}
      </DialogTitle>
      <form onSubmit={handleSubmit}>
        <DialogContent>
          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}
          <Box sx={{ mt: 2 }}>
            {type === 'income' ? (
              <>
                <TextField
                  fullWidth
                  label={t('incomeExpense.dialog.fields.name')}
                  value={formData.name || ''}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                  margin="normal"
                />
                <TextField
                  fullWidth
                  label={t('incomeExpense.dialog.fields.iqamaNumber')}
                  value={formData.iqamaNumber || ''}
                  onChange={(e) => setFormData({ ...formData, iqamaNumber: e.target.value })}
                  required
                  margin="normal"
                />
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
            ) : (
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
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose}>{t('common.cancel')}</Button>
          <Button type="submit" variant="contained" color="primary">
            {t('common.save')}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
};

export default AddEditDialog;