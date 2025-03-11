import React from 'react';
import { Grid, Card, CardContent, Typography, Avatar, Box } from '@mui/material';
import {
  TrendingUp as IncomeIcon,
  TrendingDown as ExpenseIcon,
  MoneyOff as MoneyIcon
} from '@mui/icons-material';
import { useTranslation } from 'react-i18next';

const StatsCards = ({
  totalIncome,
  totalExpense,
  lastMonthIncome,
  lastMonthExpense,
  calculatePercentageChange
}) => {
  const { t } = useTranslation();

  return (
    <Grid container spacing={3} mb={4}>
      {/* Income Card */}
      <Grid item xs={12} md={4}>
        <Card 
          sx={{ 
            height: '100%',
            borderRadius: 4,
            background: 'linear-gradient(135deg, #4CAF50 0%, #45a049 100%)',
            position: 'relative',
            overflow: 'hidden'
          }}
        >
          <Box
            sx={{
              position: 'absolute',
              right: -20,
              top: -20,
              width: 150,
              height: 150,
              borderRadius: '50%',
              bgcolor: 'rgba(255,255,255,0.1)'
            }}
          />
          <CardContent sx={{ position: 'relative', p: 3 }}>
            <Avatar 
              sx={{ 
                bgcolor: 'rgba(255,255,255,0.2)',
                mb: 2,
                width: 48,
                height: 48
              }}
            >
              <IncomeIcon />
            </Avatar>
            <Typography variant="h6" color="white" gutterBottom>
              {t('incomeExpense.stats.totalIncome')}
            </Typography>
            <Typography variant="h3" fontWeight="bold" color="white">
              SR {totalIncome}
            </Typography>
            <Typography variant="body2" color="rgba(255,255,255,0.7)" sx={{ mt: 1 }}>
              {lastMonthIncome === 0 && totalIncome === 0 ? (
                t('incomeExpense.stats.noChange')
              ) : (
                t('incomeExpense.stats.percentageChange', {
                  value: calculatePercentageChange(totalIncome, lastMonthIncome).toFixed(1)
                })
              )}
            </Typography>
          </CardContent>
        </Card>
      </Grid>

      {/* Expense Card */}
      <Grid item xs={12} md={4}>
        <Card 
          sx={{ 
            height: '100%',
            borderRadius: 4,
            background: 'linear-gradient(135deg, #f44336 0%, #e53935 100%)',
            position: 'relative',
            overflow: 'hidden'
          }}
        >
          <Box
            sx={{
              position: 'absolute',
              right: -20,
              top: -20,
              width: 150,
              height: 150,
              borderRadius: '50%',
              bgcolor: 'rgba(255,255,255,0.1)'
            }}
          />
          <CardContent sx={{ position: 'relative', p: 3 }}>
            <Avatar 
              sx={{ 
                bgcolor: 'rgba(255,255,255,0.2)',
                mb: 2,
                width: 48,
                height: 48
              }}
            >
              <ExpenseIcon />
            </Avatar>
            <Typography variant="h6" color="white" gutterBottom>
              {t('incomeExpense.stats.totalExpense')}
            </Typography>
            <Typography variant="h3" fontWeight="bold" color="white">
              SR {totalExpense}
            </Typography>
            <Typography variant="body2" color="rgba(255,255,255,0.7)" sx={{ mt: 1 }}>
              {lastMonthExpense === 0 && totalExpense === 0 ? (
                t('incomeExpense.stats.noChange')
              ) : (
                t('incomeExpense.stats.percentageChange', {
                  value: calculatePercentageChange(totalExpense, lastMonthExpense).toFixed(1)
                })
              )}
            </Typography>
          </CardContent>
        </Card>
      </Grid>

      {/* Net Balance Card */}
      <Grid item xs={12} md={4}>
        <Card 
          sx={{ 
            height: '100%',
            borderRadius: 4,
            background: 'linear-gradient(135deg, #2196F3 0%, #1976D2 100%)',
            position: 'relative',
            overflow: 'hidden'
          }}
        >
          <Box
            sx={{
              position: 'absolute',
              right: -20,
              top: -20,
              width: 150,
              height: 150,
              borderRadius: '50%',
              bgcolor: 'rgba(255,255,255,0.1)'
            }}
          />
          <CardContent sx={{ position: 'relative', p: 3 }}>
            <Avatar 
              sx={{ 
                bgcolor: 'rgba(255,255,255,0.2)',
                mb: 2,
                width: 48,
                height: 48
              }}
            >
              <MoneyIcon />
            </Avatar>
            <Typography variant="h6" color="white" gutterBottom>
              {t('incomeExpense.stats.netBalance')}
            </Typography>
            <Typography variant="h3" fontWeight="bold" color="white">
              SR {totalIncome - totalExpense}
            </Typography>
            <Typography variant="body2" color="rgba(255,255,255,0.7)" sx={{ mt: 1 }}>
              {t('incomeExpense.stats.currentMonth')}
            </Typography>
          </CardContent>
        </Card>
      </Grid>
    </Grid>
  );
};

export default StatsCards; 