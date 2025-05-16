import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { startOfMonth, endOfMonth } from 'date-fns';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  RadioGroup,
  FormControlLabel,
  Radio,
  Box,
  Grid
} from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';

const ExportDialog = ({
  open,
  onClose,
  type,
  dateFilterType,
  exportStartDate,
  exportEndDate,
  exportSpecificDate,
  selectedReferredBy,
  referredByList = [],
  onDateFilterTypeChange,
  onStartDateChange,
  onEndDateChange,
  onSpecificDateChange,
  onReferredByChange,
  onExport
}) => {
  const { t } = useTranslation();

  const handleExport = () => {
    onExport();
    onClose();
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>
        {t('incomeExpense.dialog.export.title', { type: type === 'income' ? t('incomeExpense.income.title') : t('incomeExpense.expense.title') })}
      </DialogTitle>
      <DialogContent>
        <Box sx={{ mt: 2 }}>
          <FormControl component="fieldset" sx={{ mb: 2 }}>
            <RadioGroup value={dateFilterType} onChange={(e) => onDateFilterTypeChange(e.target.value)}>
              <FormControlLabel value="range" control={<Radio />} label={t('incomeExpense.dialog.export.dateRange')} />
              <FormControlLabel value="specific" control={<Radio />} label={t('incomeExpense.dialog.export.specificDate')} />
            </RadioGroup>
          </FormControl>

          {dateFilterType === 'range' ? (
            <Grid container spacing={2}>
              <Grid item xs={6}>
                <LocalizationProvider dateAdapter={AdapterDateFns}>
                  <DatePicker
                    label={t('incomeExpense.dialog.export.startDate')}
                    value={exportStartDate}
                    onChange={onStartDateChange}
                    slotProps={{ textField: { fullWidth: true } }}
                  />
                </LocalizationProvider>
              </Grid>
              <Grid item xs={6}>
                <LocalizationProvider dateAdapter={AdapterDateFns}>
                  <DatePicker
                    label={t('incomeExpense.dialog.export.endDate')}
                    value={exportEndDate}
                    onChange={onEndDateChange}
                    slotProps={{ textField: { fullWidth: true } }}
                  />
                </LocalizationProvider>
              </Grid>
            </Grid>
          ) : (
            <Box sx={{ mt: 2 }}>
              <LocalizationProvider dateAdapter={AdapterDateFns}>
                <DatePicker
                  label={t('incomeExpense.dialog.export.selectDate')}
                  value={exportSpecificDate}
                  onChange={onSpecificDateChange}
                  slotProps={{ textField: { fullWidth: true } }}
                />
              </LocalizationProvider>
            </Box>
          )}

          {type === 'income' && (
            <FormControl fullWidth sx={{ mt: 2 }}>
              <InputLabel>{t('incomeExpense.dialog.export.referredBy')}</InputLabel>
              <Select
                value={selectedReferredBy}
                onChange={(e) => onReferredByChange(e.target.value)}
                label={t('incomeExpense.dialog.export.referredBy')}
              >
                <MenuItem value="all">{t('incomeExpense.dialog.export.allReferrers')}</MenuItem>
                {referredByList.map((referredBy) => (
                  <MenuItem key={referredBy} value={referredBy}>{referredBy}</MenuItem>
                ))}
              </Select>
            </FormControl>
          )}
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>{t('common.cancel')}</Button>
        <Button onClick={handleExport} variant="contained" color="primary">
          {t('incomeExpense.buttons.export')}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default ExportDialog;