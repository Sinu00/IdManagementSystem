import React from 'react';
import { Box, Avatar, Typography, Stack, IconButton, Button, Tooltip } from '@mui/material';
import {
  FilterAlt as FilterIcon,
  Refresh as RefreshIcon,
  Add as AddIcon,
  Receipt as ReceiptIcon,
  TrendingUp as IncomeIcon,
  TrendingDown as ExpenseIcon
} from '@mui/icons-material';
import { useTranslation } from 'react-i18next';

const TableHeader = ({
  type,
  showFilters,
  onToggleFilters,
  onRefresh,
  onAdd,
  onExport,
  loading
}) => {
  const { t } = useTranslation();
  const isIncome = type === 'income';
  const color = isIncome ? 'success' : 'error';
  const Icon = isIncome ? IncomeIcon : ExpenseIcon;

  return (
    <Box 
      sx={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        mb: 3,
        flexWrap: 'wrap',
        gap: 2
      }}
    >
      <Box display="flex" alignItems="center" gap={1}>
        <Avatar 
          sx={{ 
            bgcolor: `${color}.lighter`,
            color: `${color}.main`
          }}
        >
          <Icon />
        </Avatar>
        <Typography variant="h6" fontWeight="bold">
          {t(`incomeExpense.${type}.title`)}
        </Typography>
      </Box>
      <Stack direction="row" spacing={1}>
        <IconButton 
          onClick={onToggleFilters}
          sx={{ 
            color: showFilters ? 'primary.main' : 'text.secondary',
            bgcolor: showFilters ? 'primary.lighter' : 'transparent'
          }}
        >
          <FilterIcon />
        </IconButton>
        <Tooltip title={t('incomeExpense.buttons.refresh')}>
          <IconButton 
            onClick={onRefresh}
            disabled={loading}
            sx={{ 
              bgcolor: `${color}.main`,
              color: '#fff',
              '&:hover': { 
                bgcolor: `${color}.dark`, 
                color: '#fff' 
              },
              '&.Mui-disabled': {
                bgcolor: `${color}.main`,
                opacity: 0.5
              }
            }}
          >
            <RefreshIcon 
              sx={{ 
                animation: loading ? 'spin 1s linear infinite' : 'none',
                '@keyframes spin': {
                  '0%': {
                    transform: 'rotate(0deg)',
                  },
                  '100%': {
                    transform: 'rotate(360deg)',
                  },
                },
              }}
            />
          </IconButton>
        </Tooltip>
        <Button 
          startIcon={<AddIcon />}
          variant="contained"
          size="small"
          onClick={onAdd}
          sx={{ 
            borderRadius: 2,
            bgcolor: `${color}.main`,
            '&:hover': {
              bgcolor: `${color}.dark`
            }
          }}
        >
          {t('incomeExpense.buttons.add')}
        </Button>
        <Button 
          startIcon={<ReceiptIcon />}
          variant="outlined"
          size="small"
          onClick={onExport}
          sx={{ 
            borderRadius: 2,
            borderColor: `${color}.main`,
            color: `${color}.main`,
            '&:hover': {
              borderColor: `${color}.dark`,
              bgcolor: `${color}.lighter`
            }
          }}
        >
          {t('incomeExpense.buttons.export')}
        </Button>
      </Stack>
    </Box>
  );
};

export default TableHeader; 