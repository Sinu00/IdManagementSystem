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
  Grid,
  Divider,
  Snackbar,
  Alert
} from '@mui/material';
import { Edit as EditIcon, Delete as DeleteIcon } from '@mui/icons-material';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { format } from 'date-fns';

import TableHeader from '../components/TableHeader';
import FilterSection from './FilterSection';
import EmptyState from '../components/EmptyState';
import { individualApi } from '../../../services/api';

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
  const navigate = useNavigate();
  const [error, setError] = useState('');
  const [loadingNavigation, setLoadingNavigation] = useState(false);

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

  const handleIncomeClick = async (income, event) => {
    // Prevent navigation if clicking on edit/delete buttons
    if (event.target.closest('button')) {
      return;
    }

    // Only handle auto-generated incomes with iqamaNumber
    if (income.isCustomIncome || !income.iqamaNumber) {
      return;
    }

    try {
      setLoadingNavigation(true);
      setError('');
      
      // Fetch individual by iqamaNumber
      const response = await individualApi.getByIqamaNumber(income.iqamaNumber);
      const individual = response.data;

      if (!individual || !individual.company) {
        setError('Individual or company not found for this income entry.');
        return;
      }

      // Navigate to company's individuals page
      const companyId = individual.company._id || individual.company;
      navigate(`/company/${companyId}/individuals`);
    } catch (error) {
      console.error('Error fetching individual:', error);
      setError(error.response?.data?.message || 'Failed to find individual. Please try again.');
    } finally {
      setLoadingNavigation(false);
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
        type="income"
        showFilters={showFilters}
        onToggleFilters={onToggleFilters}
        onRefresh={onRefresh}
        onAdd={onAdd}
        onExport={onExport}
        loading={loading}
      />

      <FilterSection 
        type="income" 
        visible={showFilters}
        filters={filters}
        onFilterChange={onFilterChange}
        referredByList={referredByList}
      />

      {loading ? (
        <Box sx={{ py: 2 }}>
          <Skeleton height={50} />
          <Skeleton height={50} />
          <Skeleton height={50} />
        </Box>
      ) : (
        <>
          {incomes.length > 0 ? (
            <>
              <Divider sx={{ mb: 3 }} />
              {/* Stats Section */}
              <Grid container spacing={4} sx={{ mb: 3 }}>
                <Grid item xs={6}>
                  <Box sx={{ p: 2, bgcolor: 'error.lighter', borderRadius: 2 }}>
                    <Typography variant="body2" color="error.main">{t('incomeExpense.stats.thisMonth')}</Typography>
                    <Typography variant="h6" fontWeight="bold">SAR {(totalIncome || 0).toFixed(2)}</Typography>
                  </Box>
                </Grid>
                <Grid item xs={6}>
                  <Box sx={{ p: 2, bgcolor: 'error.lighter', borderRadius: 2 }}>
                    <Typography variant="body2" color="error.main">{t('incomeExpense.stats.lastMonth')}</Typography>
                    <Typography variant="h6" fontWeight="bold">SAR {(lastMonthIncome || 0).toFixed(2)}</Typography>
                  </Box>
                </Grid>
              </Grid>
              <Divider sx={{ mb: 3 }} />

              <TableContainer>
                <Table size="small" aria-label="income table">
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
                        {t('incomeExpense.income.table.date')} {sortField === 'transactionDate' && (sortOrder === 'asc' ? '↑' : '↓')}
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
                              {formatDate(income.transactionDate)}
                            </Typography>
                          </TableCell>
                          <TableCell
                            onClick={(e) => handleIncomeClick(income, e)}
                            sx={{
                              cursor: !income.isCustomIncome && income.iqamaNumber ? 'pointer' : 'default',
                              '&:hover': !income.isCustomIncome && income.iqamaNumber ? {
                                bgcolor: 'action.hover'
                              } : {}
                            }}
                          >
                            <Typography 
                              variant="body2"
                              sx={{
                                color: !income.isCustomIncome && income.iqamaNumber ? 'primary.main' : 'inherit',
                                textDecoration: !income.isCustomIncome && income.iqamaNumber ? 'none' : 'none',
                                '&:hover': !income.isCustomIncome && income.iqamaNumber ? {
                                  textDecoration: 'underline'
                                } : {}
                              }}
                            >
                              {income.name}
                            </Typography>
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
                              onClick={(e) => {
                                e.stopPropagation();
                                onEdit(income);
                              }}
                              sx={{ color: 'primary.main', mr: 1 }}
                            >
                              <EditIcon fontSize="small" />
                            </IconButton>
                            <IconButton
                              size="small"
                              onClick={(e) => {
                                e.stopPropagation();
                                onDelete(income);
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

export default IncomeSection;