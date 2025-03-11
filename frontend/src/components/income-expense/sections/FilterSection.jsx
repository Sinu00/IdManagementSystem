import React from 'react';
import { Box, Paper, Grid, TextField, FormControl, InputLabel, Select, MenuItem } from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { useTranslation } from 'react-i18next';

const FilterSection = ({ 
  type, 
  visible, 
  filters, 
  onFilterChange, 
  referredByList = [] 
}) => {
  const { t } = useTranslation();

  if (!visible) return null;

  return (
    <Box sx={{ mb: 3 }}>
      <Paper sx={{ p: 2 }}>
        <Grid container spacing={2}>
          <Grid item xs={12} md={4}>
            <TextField
              fullWidth
              size="small"
              label={t('incomeExpense.filters.searchName')}
              value={filters.nameSearch}
              onChange={(e) => onFilterChange(type, 'nameSearch', e.target.value)}
            />
          </Grid>
          <Grid item xs={12} md={4}>
            <LocalizationProvider dateAdapter={AdapterDateFns}>
              <DatePicker
                label={t('incomeExpense.filters.fromDate')}
                value={filters.dateRange.start}
                onChange={(newValue) => onFilterChange(type, 'dateRange', { 
                  ...filters.dateRange, 
                  start: newValue 
                })}
                slotProps={{ 
                  textField: { 
                    size: 'small', 
                    fullWidth: true
                  }
                }}
                format="dd/MM/yyyy"
              />
            </LocalizationProvider>
          </Grid>
          <Grid item xs={12} md={4}>
            <LocalizationProvider dateAdapter={AdapterDateFns}>
              <DatePicker
                label={t('incomeExpense.filters.toDate')}
                value={filters.dateRange.end}
                onChange={(newValue) => onFilterChange(type, 'dateRange', { 
                  ...filters.dateRange, 
                  end: newValue 
                })}
                slotProps={{ 
                  textField: { 
                    size: 'small', 
                    fullWidth: true
                  }
                }}
                format="dd/MM/yyyy"
              />
            </LocalizationProvider>
          </Grid>
          {type === 'income' && (
            <Grid item xs={12} md={4}>
              <FormControl fullWidth size="small">
                <InputLabel>{t('incomeExpense.filters.referredBy')}</InputLabel>
                <Select
                  value={filters.referredBy}
                  label={t('incomeExpense.filters.referredBy')}
                  onChange={(e) => onFilterChange(type, 'referredBy', e.target.value)}
                >
                  <MenuItem value="all">{t('incomeExpense.dialog.export.allReferrers')}</MenuItem>
                  {referredByList.map((ref) => (
                    <MenuItem key={ref} value={ref}>{ref}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
          )}
          {type === 'expense' && (
            <Grid item xs={12} md={4}>
              <FormControl fullWidth size="small">
                <InputLabel>{t('incomeExpense.filters.expenseType')}</InputLabel>
                <Select
                  value={filters.expenseType}
                  label={t('incomeExpense.filters.expenseType')}
                  onChange={(e) => onFilterChange(type, 'expenseType', e.target.value)}
                >
                  <MenuItem value="all">{t('incomeExpense.filters.allTypes')}</MenuItem>
                  <MenuItem value="cr">{t('incomeExpense.expense.types.cr')}</MenuItem>
                  <MenuItem value="qiwa">{t('incomeExpense.expense.types.qiwa')}</MenuItem>
                  <MenuItem value="muqeem">{t('incomeExpense.expense.types.muqeem')}</MenuItem>
                  <MenuItem value="saudi">{t('incomeExpense.expense.types.saudi')}</MenuItem>
                  <MenuItem value="efa">{t('incomeExpense.expense.types.efa')}</MenuItem>
                  <MenuItem value="other">{t('incomeExpense.expense.types.other')}</MenuItem>
                </Select>
              </FormControl>
            </Grid>
          )}
        </Grid>
      </Paper>
    </Box>
  );
};

export default FilterSection; 