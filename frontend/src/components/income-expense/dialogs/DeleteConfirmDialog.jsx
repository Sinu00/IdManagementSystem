import { Dialog, DialogTitle, DialogContent, DialogActions, Button, Typography } from '@mui/material';
import { useTranslation } from 'react-i18next';

const DeleteConfirmDialog = ({ open, onClose, onConfirm, type }) => {
  const { t } = useTranslation();

  const handleConfirm = () => {
    onConfirm();
    onClose();
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>{t('incomeExpense.dialog.delete.title')}</DialogTitle>
      <DialogContent>
        <Typography>
          {t('incomeExpense.dialog.delete.message', { 
            type: type === 'income' ? t('incomeExpense.income.title') : t('incomeExpense.expense.title') 
          })}
        </Typography>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>{t('common.cancel')}</Button>
        <Button onClick={handleConfirm} color="error" variant="contained">
          {t('common.delete')}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default DeleteConfirmDialog;