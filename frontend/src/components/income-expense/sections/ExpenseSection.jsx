import React, { useState } from 'react';
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
  Tooltip,
  Grid,
  Card,
  CardContent,
  Avatar,
  Divider,
  Snackbar,
  Alert
} from '@mui/material';
import { Edit as EditIcon, Delete as DeleteIcon, TrendingDown as ExpenseIcon } from '@mui/icons-material';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { format } from 'date-fns';

import TableHeader from '../components/TableHeader';
import FilterSection from './FilterSection';
import EmptyState from '../components/EmptyState';

const ExpenseSection = ({
  loading,
  expenses,
  showFilters,
  filters,
  onFilterChange,
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
  totalExpense,
  lastMonthExpense
}) => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [error, setError] = useState('');

  const formatDate = (dateString) => {
    try {
      const date = new Date(dateString);
      return format(date, 'MMM dd, yyyy HH:mm');
    } catch (error) {
      console.error('Date formatting error:', error);
      return 'Invalid Date';
    }
  };

  const calculatePercentageChange = (current, previous) => {
    if (previous === 0) return current > 0 ? 100 : 0;
    return ((current - previous) / previous) * 100;
  };

  const handleExpenseClick = (expense, event) => {
    // Prevent navigation if clicking on edit/delete buttons
    if (event.target.closest('button')) {
      return;
    }

    // Only handle expenses with company reference
    if (!expense.company) {
      return;
    }

    try {
      // Get company ID (handle both populated object and ID string)
      const companyId = expense.company._id || expense.company;
      
      if (!companyId) {
        setError('Company information not available for this expense entry.');
        return;
      }

      // Navigate to company's individuals page
      navigate(`/company/${companyId}/individuals`);
    } catch (error) {
      console.error('Error navigating to company page:', error);
      setError('Failed to navigate to company page. Please try again.');
    }
  };

  const handleCloseError = () => {
    setError('');
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
        type="expense"
        showFilters={showFilters}
        onToggleFilters={onToggleFilters}
        onRefresh={onRefresh}
        onAdd={onAdd}
        onExport={onExport}
        loading={loading}
      />

      <FilterSection 
        type="expense" 
        visible={showFilters}
        filters={filters}
        onFilterChange={onFilterChange}
      />

      {loading ? (
        <Box sx={{ py: 2 }}>
          <Skeleton height={50} />
          <Skeleton height={50} />
          <Skeleton height={50} />
        </Box>
      ) : (
        <>
          {expenses.length > 0 ? (
            <>
              <Divider sx={{ mb: 3 }} />
              {/* Stats Section */}
              <Grid container spacing={4} sx={{ mb: 3 }}>
                <Grid item xs={6}>
                  <Box sx={{ p: 2, bgcolor: 'error.lighter', borderRadius: 2 }}>
                    <Typography variant="body2" color="error.main">{t('incomeExpense.stats.thisMonth')}</Typography>
                    <Typography variant="h6" fontWeight="bold">SAR {(totalExpense || 0).toFixed(2)}</Typography>
                  </Box>
                </Grid>
                <Grid item xs={6}>
                  <Box sx={{ p: 2, bgcolor: 'error.lighter', borderRadius: 2 }}>
                    <Typography variant="body2" color="error.main">{t('incomeExpense.stats.lastMonth')}</Typography>
                    <Typography variant="h6" fontWeight="bold">SAR {(lastMonthExpense || 0).toFixed(2)}</Typography>
                  </Box>
                </Grid>
              </Grid>
              <Divider sx={{ mb: 3 }} />

              <TableContainer>
                <Table size="small" aria-label="expense table">
                  <TableHead>
                    <TableRow>
                      <TableCell 
                        onClick={() => onSort('transactionDate')}
                        sx={{ 
                          cursor: 'pointer', 
                          '&:hover': { bgcolor: 'action.hover' },
                          width: '15%',
                          whiteSpace: 'nowrap',
                          textAlign: 'left'
                        }}
                      >
                        {t('incomeExpense.expense.table.date')} {sortField === 'transactionDate' && (sortOrder === 'asc' ? '↑' : '↓')}
                      </TableCell>
                      <TableCell 
                        onClick={() => onSort('company.name')}
                        sx={{ 
                          cursor: 'pointer', 
                          '&:hover': { bgcolor: 'action.hover' },
                          width: '25%'
                        }}
                      >
                        {t('incomeExpense.expense.table.company')} {sortField === 'company.name' && (sortOrder === 'asc' ? '↑' : '↓')}
                      </TableCell>
                      <TableCell 
                        onClick={() => onSort('expenseType')}
                        sx={{ 
                          cursor: 'pointer', 
                          '&:hover': { bgcolor: 'action.hover' },
                          width: '20%'
                        }}
                      >
                        {t('incomeExpense.expense.table.paidFor')} {sortField === 'expenseType' && (sortOrder === 'asc' ? '↑' : '↓')}
                      </TableCell>
                      <TableCell 
                        onClick={() => onSort('amount')}
                        sx={{ 
                          cursor: 'pointer', 
                          '&:hover': { bgcolor: 'action.hover' },
                          width: '20%'
                        }}
                      >
                        {t('incomeExpense.expense.table.amount')} {sortField === 'amount' && (sortOrder === 'asc' ? '↑' : '↓')}
                      </TableCell>
                      <TableCell 
                        sx={{ 
                          width: '15%',
                          textAlign: 'center'
                        }}
                      >
                        {t('incomeExpense.expense.table.actions')}
                      </TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {expenses
                      .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                      .map((expense) => (
                        <TableRow
                          key={expense._id}
                          sx={{
                            '&:last-child td, &:last-child th': { border: 0 },
                            '&:hover': { bgcolor: 'action.hover' }
                          }}
                        >
                          <TableCell 
                            sx={{ 
                              width: '15%',
                              p: 1
                            }}
                          >
                            <Typography
                              sx={{
                                whiteSpace: 'nowrap',
                                textAlign: 'left',
                                display: 'block',
                                lineHeight: 1.2
                              }}
                            >
                              {formatDate(expense.transactionDate)}
                            </Typography>
                          </TableCell>
                          <TableCell
                            onClick={(e) => handleExpenseClick(expense, e)}
                            sx={{
                              cursor: expense.company ? 'pointer' : 'default',
                              '&:hover': expense.company ? {
                                bgcolor: 'action.hover'
                              } : {}
                            }}
                          >
                            {expense.company ? (
                              <Typography 
                                variant="body2"
                                sx={{
                                  color: 'primary.main',
                                  textDecoration: 'none',
                                  '&:hover': {
                                    textDecoration: 'underline'
                                  }
                                }}
                              >
                                {expense.company.name}
                              </Typography>
                            ) : (
                              <Typography variant="body2" color="text.secondary">-</Typography>
                            )}
                          </TableCell>
                          <TableCell>
                            {expense.expenseType === 'other' ? (
                              expense.specification || t('incomeExpense.expense.types.other')
                            ) : (
                              t(`incomeExpense.expense.types.${expense.expenseType}`)
                            )}
                          </TableCell>
                          <TableCell sx={{ color: 'error.main', fontWeight: 'bold' }}>
                            {(expense.amount || 0).toFixed(2)}
                          </TableCell>
                          <TableCell sx={{ textAlign: 'center' }}>
                            <IconButton
                              size="small"
                              onClick={(e) => {
                                e.stopPropagation();
                                onEdit(expense);
                              }}
                              sx={{ color: 'primary.main', mr: 1 }}
                            >
                              <EditIcon fontSize="small" />
                            </IconButton>
                            <IconButton
                              size="small"
                              onClick={(e) => {
                                e.stopPropagation();
                                onDelete(expense);
                              }}
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
                count={expenses.length}
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
            <EmptyState type="expense" />
          )}
        </>
      )}
      <Snackbar
        open={!!error}
        autoHideDuration={6000}
        onClose={handleCloseError}
        anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
      >
        <Alert onClose={handleCloseError} severity="error" sx={{ width: '100%' }}>
          {error}
        </Alert>
      </Snackbar>
    </Paper>
  );
};

export default ExpenseSection;