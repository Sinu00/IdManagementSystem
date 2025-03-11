import React from 'react';
import { Box, Typography } from '@mui/material';
import { TrendingUp as IncomeIcon, TrendingDown as ExpenseIcon } from '@mui/icons-material';
import { useTranslation } from 'react-i18next';

const EmptyState = ({ type }) => {
  const { t } = useTranslation();
  const Icon = type === 'income' ? IncomeIcon : ExpenseIcon;
  const color = type === 'income' ? 'success' : 'error';

  return (
    <Box sx={{ textAlign: 'center', py: 4 }}>
      <Icon sx={{ fontSize: 48, color: `${color}.light`, mb: 2 }} />
      <Typography color="text.secondary" variant="h6">
        {t(`incomeExpense.no${type.charAt(0).toUpperCase() + type.slice(1)}Records`)}
      </Typography>
      <Typography color="text.disabled" variant="body2">
        {t(`incomeExpense.addFirst${type.charAt(0).toUpperCase() + type.slice(1)}Transaction`)}
      </Typography>
    </Box>
  );
};

export default EmptyState; 