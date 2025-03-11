import React from 'react';
import {
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Typography,
  TablePagination,
  Skeleton,
  Box,
  Grid
} from '@mui/material';
import { Edit as EditIcon, Delete as DeleteIcon } from '@mui/icons-material';
import { useTranslation } from 'react-i18next';
import { format } from 'date-fns';

import TableHeader from '../components/TableHeader';
import FilterSection from './FilterSection';
import EmptyState from '../components/EmptyState';

const IncomeSection = ({
  loading,
  incomes,
  showFilters,
  filters,
  onFilterChange,
  referredByList,
  onToggleFilters,
  onRefresh,
  onAdd,
  onExport,
  onEdit,
  onDelete,
  page,
  onPageChange,
  rowsPerPage,
  sortField,
  sortOrder,
  onSort,
  totalIncome,
  lastMonthIncome
}) => {
  const { t } = useTranslation();

  const formatDate = (dateString) => {
    try {
      const date = new Date(dateString);
      return `${format(date, 'MMM')} ${date.getDate()}\n${date.getFullYear()}`;
    } catch (error) {
      console.error('Date formatting error:', error);
      return 'Invalid Date';
    }
  };

  const calculatePercentageChange = (current, previous) => {
    if (previous === 0) return current > 0 ? 100 : 0;
    return ((current - previous) / previous) * 100;
  };

  return (
    <Paper 
      elevation={0}
      sx={{ 
        p: 3, 
        borderRadius: 4,
        bgcolor: 'background.paper',
        border: '1px solid',
        borderColor: 'divider',
        height: '100%'
      }}
    >

      <TableHeader
        type="income"
        showFilters={showFilters}
        onToggleFilters={onToggleFilters}
        onRefresh={onRefresh}
        onAdd={onAdd}
        onExport={onExport}
        loading={loading}
      />

      {loading ? (
        <Box sx={{ py: 2 }}>
          <Skeleton height={50} />
          <Skeleton height={50} />
          <Skeleton height={50} />
        </Box>
      ) : incomes.length > 0 ? (
        <>
          <FilterSection 
            type="income" 
            visible={showFilters}
            filters={filters}
            onFilterChange={onFilterChange}
            referredByList={referredByList}
          />
                {/* Stats Section */}
      <Grid container spacing={4} sx={{ mb: 3 }}>
        <Grid item xs={6}>
          <Typography variant="subtitle2" color="success.main" gutterBottom>
            {t('incomeExpense.stats.thisMonth')}
          </Typography>
          <Typography variant="h6" sx={{ fontWeight: 'medium' }}>
            SAR {(totalIncome || 0).toFixed(2)}
          </Typography>
        </Grid>
        <Grid item xs={6}>
          <Typography variant="subtitle2" color="success.main" gutterBottom>
            {t('incomeExpense.stats.lastMonth')}
          </Typography>
          <Typography variant="h6" sx={{ fontWeight: 'medium' }}>
            SAR {(lastMonthIncome || 0).toFixed(2)}
          </Typography>
        </Grid>
      </Grid>
          <TableContainer>
            <Table size="small" aria-label="income table">
              <TableHead>
                <TableRow>
                  <TableCell 
                    onClick={() => onSort('dateAndTime')}
                    sx={{ 
                      cursor: 'pointer', 
                      '&:hover': { bgcolor: 'action.hover' },
                      width: '10%',
                      whiteSpace: 'pre-line',
                      textAlign: 'left'
                    }}
                  >
                    {t('incomeExpense.income.table.date')} {sortField === 'dateAndTime' && (sortOrder === 'asc' ? '↑' : '↓')}
                  </TableCell>
                  <TableCell 
                    onClick={() => onSort('name')}
                    sx={{ 
                      cursor: 'pointer', 
                      '&:hover': { bgcolor: 'action.hover' },
                      width: '35%'
                    }}
                  >
                    {t('incomeExpense.income.table.name')} {sortField === 'name' && (sortOrder === 'asc' ? '↑' : '↓')}
                  </TableCell>
                  <TableCell sx={{ width: '25%' }}>
                    {t('incomeExpense.income.table.iqama')}
                  </TableCell>
                  <TableCell 
                    onClick={() => onSort('amount')}
                    sx={{ 
                      cursor: 'pointer', 
                      '&:hover': { bgcolor: 'action.hover' },
                      width: '25%'
                    }}
                  >
                    {t('incomeExpense.income.table.amount')} {sortField === 'amount' && (sortOrder === 'asc' ? '↑' : '↓')}
                  </TableCell>
                  <TableCell 
                    sx={{ 
                      width: '15%',
                      textAlign: 'center'
                    }}
                  >
                    {t('incomeExpense.income.table.actions')}
                  </TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {incomes
                  .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                  .map((income) => (
                    <TableRow
                      key={income._id}
                      sx={{
                        '&:last-child td, &:last-child th': { border: 0 },
                        '&:hover': { bgcolor: 'action.hover' }
                      }}
                    >
                      <TableCell 
                        sx={{ 
                          width: '10%',
                          p: 1
                        }}
                      >
                        <Typography
                          sx={{
                            whiteSpace: 'pre-line',
                            textAlign: 'left',
                            display: 'block',
                            lineHeight: 1.2
                          }}
                        >
                          {formatDate(income.createdAt)}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">{income.name}</Typography>
                        {income.referredBy && (
                          <Typography variant="caption" color="text.secondary">
                            {t('incomeExpense.income.table.referredBy')} {income.referredBy}
                          </Typography>
                        )}
                      </TableCell>
                      <TableCell>{income.iqamaNumber}</TableCell>
                      <TableCell sx={{ color: 'success.main', fontWeight: 'bold' }}>
                        {(income.amount || 0).toFixed(2)}
                      </TableCell>
                      <TableCell sx={{ textAlign: 'center' }}>
                        <IconButton
                          size="small"
                          onClick={() => onEdit(income)}
                          sx={{ color: 'primary.main', mr: 1 }}
                        >
                          <EditIcon fontSize="small" />
                        </IconButton>
                        <IconButton
                          size="small"
                          onClick={() => onDelete(income)}
                          sx={{ color: 'error.main' }}
                        >
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  ))}
              </TableBody>
            </Table>
          </TableContainer>
          <TablePagination
            component="div"
            count={incomes.length}
            page={page}
            onPageChange={onPageChange}
            rowsPerPage={rowsPerPage}
            rowsPerPageOptions={[10]}
            sx={{
              borderTop: '1px solid',
              borderColor: 'divider'
            }}
          />
        </>
      ) : (
        <EmptyState type="income" />
      )}
    </Paper>
  );
};

export default IncomeSection; 