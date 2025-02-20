import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Container,
  Typography,
  Box,
  Paper,
  Grid,
  IconButton,
  Button,
  Card,
  CardContent,
  Divider,
  Stack,
  Fade,
  useTheme,
  Avatar,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Alert,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Skeleton,
} from '@mui/material';
import {
  ArrowBack as ArrowBackIcon,
  AccountBalanceWallet as WalletIcon,
  Add as AddIcon,
  TrendingUp as IncomeIcon,
  TrendingDown as ExpenseIcon,
  AttachMoney as MoneyIcon,
  Receipt as ReceiptIcon,
  DateRange as DateIcon
} from '@mui/icons-material';
import { useAuth } from '../context/AuthContext';
import { incomeApi, expenseApi } from '../services/api';
import { format, startOfMonth, endOfMonth, subMonths } from 'date-fns';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';

function IncomeExpense() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const theme = useTheme();
  const [incomes, setIncomes] = useState([]);
  const [expenses, setExpenses] = useState([]);
  const [totalIncome, setTotalIncome] = useState(0);
  const [totalExpense, setTotalExpense] = useState(0);
  const [lastMonthIncome, setLastMonthIncome] = useState(0);
  const [lastMonthExpense, setLastMonthExpense] = useState(0);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogType, setDialogType] = useState('income'); // 'income' or 'expense'
  const [formData, setFormData] = useState({
    name: '',
    amount: '',

    iqamaNumber: '' // only for income
  });
  const [error, setError] = useState('');
  const [sortField, setSortField] = useState('createdAt');
  const [sortOrder, setSortOrder] = useState('desc');
  const [expenseSortField, setExpenseSortField] = useState('createdAt');
  const [expenseSortOrder, setExpenseSortOrder] = useState('desc');

  const calculatePercentageChange = (current, previous) => {
    if (previous === 0) return current > 0 ? 100 : 0;
    return ((current - previous) / previous) * 100;
  };

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const currentDate = new Date();
      const startDate = startOfMonth(currentDate);
      const endDate = endOfMonth(currentDate);
      const lastMonthStart = startOfMonth(subMonths(currentDate, 1));
      const lastMonthEnd = endOfMonth(subMonths(currentDate, 1));

      // Current month data
      const [incomeRes, expenseRes] = await Promise.all([
        incomeApi.getByDateRange(startDate.toISOString(), endDate.toISOString()),
        expenseApi.getByDateRange(startDate.toISOString(), endDate.toISOString())
      ]);

      // Last month data
      const [lastMonthIncomeRes, lastMonthExpenseRes] = await Promise.all([
        incomeApi.getByDateRange(lastMonthStart.toISOString(), lastMonthEnd.toISOString()),
        expenseApi.getByDateRange(lastMonthStart.toISOString(), lastMonthEnd.toISOString())
      ]);

      setIncomes(incomeRes.data);
      setExpenses(expenseRes.data);
      
      const currentMonthIncomeTotal = incomeRes.data.reduce((sum, item) => sum + item.amount, 0);
      const currentMonthExpenseTotal = expenseRes.data.reduce((sum, item) => sum + item.amount, 0);
      const lastMonthIncomeTotal = lastMonthIncomeRes.data.reduce((sum, item) => sum + item.amount, 0);
      const lastMonthExpenseTotal = lastMonthExpenseRes.data.reduce((sum, item) => sum + item.amount, 0);

      setTotalIncome(currentMonthIncomeTotal);
      setTotalExpense(currentMonthExpenseTotal);
      setLastMonthIncome(lastMonthIncomeTotal);
      setLastMonthExpense(lastMonthExpenseTotal);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenDialog = (type) => {
    setDialogType(type);
    setFormData({
      name: '',
      amount: '',
      iqamaNumber: ''
    });
    setDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const data = {
        ...formData,
        amount: parseFloat(formData.amount)
      };

      if (dialogType === 'income') {
        await incomeApi.create(data);
      } else {
        await expenseApi.create(data);
      }

      handleCloseDialog();
      fetchData();
    } catch (error) {
      setError(error.response?.data?.message || 'An error occurred');
    }
  };

  const handleSort = (field) => {
    setSortField(field);
    setSortOrder(currentOrder => currentOrder === 'asc' ? 'desc' : 'asc');
  };

  const sortedIncomes = useMemo(() => {
    return [...incomes].sort((a, b) => {
      let comparison = 0;
      switch (sortField) {
        case 'createdAt':
          comparison = new Date(a.createdAt) - new Date(b.createdAt);
          break;
        case 'amount':
          comparison = a.amount - b.amount;
          break;
        default:
          comparison = String(a[sortField]).localeCompare(String(b[sortField]));
      }
      return sortOrder === 'asc' ? comparison : -comparison;
    });
  }, [incomes, sortField, sortOrder]);

  const handleExpenseSort = (field) => {
    setExpenseSortField(field);
    setExpenseSortOrder(currentOrder => currentOrder === 'asc' ? 'desc' : 'asc');
  };

  const sortedExpenses = useMemo(() => {
    return [...expenses].sort((a, b) => {
      let comparison = 0;
      switch (expenseSortField) {
        case 'createdAt':
          comparison = new Date(a.createdAt) - new Date(b.createdAt);
          break;
        case 'amount':
          comparison = a.amount - b.amount;
          break;
        default:
          comparison = String(a[expenseSortField]).localeCompare(String(b[expenseSortField]));
      }
      return expenseSortOrder === 'asc' ? comparison : -comparison;
    });
  }, [expenses, expenseSortField, expenseSortOrder]);

  return (
    <Box sx={{ width: '100%', minHeight: '100vh', bgcolor: 'background.default', pt: 4, pb: 6 }}>
      <Container maxWidth="lg">
        {/* Header Section */}
        <Box 
          sx={{ 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'space-between',
            mb: 4,
            flexWrap: 'wrap',
            gap: 2
          }}
        >
          <Box display="flex" alignItems="center" gap={2}>
            <IconButton 
              onClick={() => navigate(-1)} 
              sx={{ 
                color: 'primary.main',
                bgcolor: 'primary.lighter',
                '&:hover': { bgcolor: 'primary.light' }
              }}
            >
              <ArrowBackIcon />
            </IconButton>
            <Box>
              <Typography variant="h4" fontWeight="bold">
                Financial Overview
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Track your income and expenses
              </Typography>
            </Box>
          </Box>
          
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            sx={{
              borderRadius: 2,
              px: 3,
              py: 1.5,
              bgcolor: 'success.main',
              '&:hover': {
                bgcolor: 'success.dark',
                transform: 'translateY(-2px)',
                boxShadow: theme.shadows[4]
              },
              transition: 'all 0.2s'
            }}
            onClick={() => handleOpenDialog('income')}
          >
            New Transaction
          </Button>
        </Box>

        {/* Summary Cards */}
        <Grid container spacing={3} mb={4}>
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
                  Total Income
                </Typography>
                <Typography variant="h3" fontWeight="bold" color="white">
                  SAR {totalIncome.toFixed(2)}
                </Typography>
                <Typography variant="body2" color="rgba(255,255,255,0.7)" sx={{ mt: 1 }}>
                  {lastMonthIncome === 0 && totalIncome === 0 ? (
                    'No change from last month'
                  ) : (
                    <>
                      {calculatePercentageChange(totalIncome, lastMonthIncome) >= 0 ? '+' : ''}
                      {calculatePercentageChange(totalIncome, lastMonthIncome).toFixed(1)}% from last month
                    </>
                  )}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          
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
                  Total Expense
                </Typography>
                <Typography variant="h3" fontWeight="bold" color="white">
                  SAR {totalExpense.toFixed(2)}
                </Typography>
                <Typography variant="body2" color="rgba(255,255,255,0.7)" sx={{ mt: 1 }}>
                  {lastMonthExpense === 0 && totalExpense === 0 ? (
                    'No change from last month'
                  ) : (
                    <>
                      {calculatePercentageChange(totalExpense, lastMonthExpense) >= 0 ? '+' : ''}
                      {calculatePercentageChange(totalExpense, lastMonthExpense).toFixed(1)}% from last month
                    </>
                  )}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          
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
                  Net Balance
                </Typography>
                <Typography variant="h3" fontWeight="bold" color="white">
                  SAR 0.00
                </Typography>
                <Typography variant="body2" color="rgba(255,255,255,0.7)" sx={{ mt: 1 }}>
                  Current month
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        {/* Income & Expense Sections */}
        <Grid container spacing={3}>
          {/* Income Section */}
          <Grid item xs={12} md={6}>
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
                      bgcolor: 'success.lighter',
                      color: 'success.main'
                    }}
                  >
                    <IncomeIcon />
                  </Avatar>
                  <Typography variant="h6" fontWeight="bold">
                    Income Details
                  </Typography>
                </Box>
                <Stack direction="row" spacing={1}>
                  <Button 
                    startIcon={<AddIcon />}
                    variant="contained"
                    size="small"
                    onClick={() => handleOpenDialog('income')}
                    sx={{ 
                      borderRadius: 2,
                      bgcolor: 'success.main',
                      '&:hover': {
                        bgcolor: 'success.dark'
                      }
                    }}
                  >
                    Add
                  </Button>
                  <Button 
                    startIcon={<DateIcon />}
                    variant="outlined"
                    size="small"
                    sx={{ 
                      borderRadius: 2,
                      borderColor: 'success.main',
                      color: 'success.main',
                      '&:hover': {
                        borderColor: 'success.dark',
                        bgcolor: 'success.lighter'
                      }
                    }}
                  >
                    Filter
                  </Button>
                  <Button 
                    startIcon={<ReceiptIcon />}
                    variant="outlined"
                    size="small"
                    sx={{ 
                      borderRadius: 2,
                      borderColor: 'success.main',
                      color: 'success.main',
                      '&:hover': {
                        borderColor: 'success.dark',
                        bgcolor: 'success.lighter'
                      }
                    }}
                  >
                    Export
                  </Button>
                </Stack>
              </Box>
              <Divider sx={{ mb: 3 }} />

              {/* Income Stats */}
              <Grid container spacing={2} mb={3}>
                <Grid item xs={6}>
                  <Box sx={{ p: 2, bgcolor: 'success.lighter', borderRadius: 2 }}>
                    <Typography variant="body2" color="success.main">This Month</Typography>
                    <Typography variant="h6" fontWeight="bold">SAR {totalIncome.toFixed(2)}</Typography>
                  </Box>
                </Grid>
                <Grid item xs={6}>
                  <Box sx={{ p: 2, bgcolor: 'success.lighter', borderRadius: 2 }}>
                    <Typography variant="body2" color="success.main">Last Month</Typography>
                    <Typography variant="h6" fontWeight="bold">SAR {lastMonthIncome.toFixed(2)}</Typography>
                  </Box>
                </Grid>
              </Grid>

              {/* Income List */}
              {loading ? (
                <Box sx={{ py: 2 }}>
                  <Skeleton height={50} />
                  <Skeleton height={50} />
                  <Skeleton height={50} />
                </Box>
              ) : incomes.length > 0 ? (
                <TableContainer>
                  <Table sx={{ minWidth: 650 }} aria-label="income table">
                    <TableHead>
                      <TableRow>
                        <TableCell 
                          onClick={() => handleSort('dateAndTime')}
                          sx={{ cursor: 'pointer', '&:hover': { bgcolor: 'action.hover' } }}
                        >
                          Date {sortField === 'dateAndTime' && (sortOrder === 'asc' ? '↑' : '↓')}
                        </TableCell>
                        <TableCell 
                          onClick={() => handleSort('name')}
                          sx={{ cursor: 'pointer', '&:hover': { bgcolor: 'action.hover' } }}
                        >
                          Name {sortField === 'name' && (sortOrder === 'asc' ? '↑' : '↓')}
                        </TableCell>
                        <TableCell>Iqama Number</TableCell>
                        <TableCell 
                          onClick={() => handleSort('amount')}
                          sx={{ cursor: 'pointer', '&:hover': { bgcolor: 'action.hover' } }}
                        >
                          Amount (SAR) {sortField === 'amount' && (sortOrder === 'asc' ? '↑' : '↓')}
                        </TableCell>
                        <TableCell>Added By</TableCell>
                        <TableCell>Referred By</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {sortedIncomes.map((income) => (
                        <TableRow
                          key={income._id}
                          sx={{
                            '&:last-child td, &:last-child th': { border: 0 },
                            '&:hover': { bgcolor: 'action.hover' }
                          }}
                        >
                          <TableCell>
                            {format(new Date(income.dateAndTime), 'dd/MM/yyyy')}
                          </TableCell>
                          <TableCell>{income.name}</TableCell>
                          <TableCell>{income.iqamaNumber}</TableCell>
                          <TableCell sx={{ color: 'success.main', fontWeight: 'bold' }}>
                            {income.amount.toFixed(2)}
                          </TableCell>
                          <TableCell>{income.addedBy}</TableCell>
                          <TableCell>{income.referredBy || '-'}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              ) : (
                <Box sx={{ textAlign: 'center', py: 4 }}>
                  <IncomeIcon sx={{ fontSize: 48, color: 'success.light', mb: 2 }} />
                  <Typography color="text.secondary" variant="h6">
                    No income records
                  </Typography>
                  <Typography color="text.disabled" variant="body2">
                    Add your first income transaction
                  </Typography>
                </Box>
              )}
            </Paper>
          </Grid>

          {/* Expense Section */}
          <Grid item xs={12} md={6}>
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
                      bgcolor: 'error.lighter',
                      color: 'error.main'
                    }}
                  >
                    <ExpenseIcon />
                  </Avatar>
                  <Typography variant="h6" fontWeight="bold">
                    Expense Details
                  </Typography>
                </Box>
                <Stack direction="row" spacing={1}>
                  <Button 
                    startIcon={<AddIcon />}
                    variant="contained"
                    size="small"
                    onClick={() => handleOpenDialog('expense')}
                    sx={{ 
                      borderRadius: 2,
                      bgcolor: 'error.main',
                      '&:hover': {
                        bgcolor: 'error.dark'
                      }
                    }}
                  >
                    Add
                  </Button>
                  <Button 
                    startIcon={<DateIcon />}
                    variant="outlined"
                    size="small"
                    sx={{ 
                      borderRadius: 2,
                      borderColor: 'error.main',
                      color: 'error.main',
                      '&:hover': {
                        borderColor: 'error.dark',
                        bgcolor: 'error.lighter'
                      }
                    }}
                  >
                    Filter
                  </Button>
                  <Button 
                    startIcon={<ReceiptIcon />}
                    variant="outlined"
                    size="small"
                    sx={{ 
                      borderRadius: 2,
                      borderColor: 'error.main',
                      color: 'error.main',
                      '&:hover': {
                        borderColor: 'error.dark',
                        bgcolor: 'error.lighter'
                      }
                    }}
                  >
                    Export
                  </Button>
                </Stack>
              </Box>

              <Divider sx={{ mb: 3 }} />

              {/* Expense Stats */}
              <Grid container spacing={2} mb={3}>
                <Grid item xs={6}>
                  <Box sx={{ p: 2, bgcolor: 'error.lighter', borderRadius: 2 }}>
                    <Typography variant="body2" color="error.main">This Month</Typography>
                    <Typography variant="h6" fontWeight="bold">SAR {totalExpense.toFixed(2)}</Typography>
                  </Box>
                </Grid>
                <Grid item xs={6}>
                  <Box sx={{ p: 2, bgcolor: 'error.lighter', borderRadius: 2 }}>
                    <Typography variant="body2" color="error.main">Last Month</Typography>
                    <Typography variant="h6" fontWeight="bold">SAR {lastMonthExpense.toFixed(2)}</Typography>
                  </Box>
                </Grid>
              </Grid>

              {/* Expense List */}
              {loading ? (
                <Box sx={{ py: 2 }}>
                  <Skeleton height={50} />
                  <Skeleton height={50} />
                  <Skeleton height={50} />
                </Box>
              ) : expenses.length > 0 ? (
                <TableContainer>
                  <Table sx={{ minWidth: 650 }} aria-label="expense table">
                    <TableHead>
                      <TableRow>
                        <TableCell 
                          onClick={() => handleExpenseSort('createdAt')}
                          sx={{ cursor: 'pointer', '&:hover': { bgcolor: 'action.hover' } }}
                        >
                          Date {expenseSortField === 'createdAt' && (expenseSortOrder === 'asc' ? '↑' : '↓')}
                        </TableCell>
                        <TableCell 
                          onClick={() => handleExpenseSort('name')}
                          sx={{ cursor: 'pointer', '&:hover': { bgcolor: 'action.hover' } }}
                        >
                          Name {expenseSortField === 'name' && (expenseSortOrder === 'asc' ? '↑' : '↓')}
                        </TableCell>
                        <TableCell 
                          onClick={() => handleExpenseSort('amount')}
                          sx={{ cursor: 'pointer', '&:hover': { bgcolor: 'action.hover' } }}
                        >
                          Amount (SAR) {expenseSortField === 'amount' && (expenseSortOrder === 'asc' ? '↑' : '↓')}
                        </TableCell>
                        <TableCell>Added By</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {sortedExpenses.map((expense) => (
                        <TableRow
                          key={expense._id}
                          sx={{
                            '&:last-child td, &:last-child th': { border: 0 },
                            '&:hover': { bgcolor: 'action.hover' }
                          }}
                        >
                          <TableCell>
                            {format(new Date(expense.createdAt), 'dd/MM/yyyy')}
                          </TableCell>
                          <TableCell>{expense.name}</TableCell>
                          <TableCell sx={{ color: 'error.main', fontWeight: 'bold' }}>
                            {expense.amount.toFixed(2)}
                          </TableCell>
                          <TableCell>{expense.addedBy || '-'}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              ) : (
                <Box sx={{ textAlign: 'center', py: 4 }}>
                  <ExpenseIcon sx={{ fontSize: 48, color: 'error.light', mb: 2 }} />
                  <Typography color="text.secondary" variant="h6">
                    No expense records
                  </Typography>
                  <Typography color="text.disabled" variant="body2">
                    Add your first expense transaction
                  </Typography>
                </Box>
              )}
            </Paper>
          </Grid>
        </Grid>
      </Container>

      <Dialog open={dialogOpen} onClose={handleCloseDialog}>
        <DialogTitle>
          Add New {dialogType === 'income' ? 'Income' : 'Expense'}
        </DialogTitle>
        <DialogContent>
          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}
          <Box component="form" onSubmit={handleSubmit} sx={{ mt: 2 }}>
            <TextField
              fullWidth
              label="Name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
              margin="normal"
            />
            {dialogType === 'income' && (
              <TextField
                fullWidth
                label="Iqama Number"
                value={formData.iqamaNumber}
                onChange={(e) => setFormData({ ...formData, iqamaNumber: e.target.value })}
                required
                margin="normal"
              />
            )}
            <TextField
              fullWidth
              label="Amount"
              type="number"
              value={formData.amount}
              onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
              required
              margin="normal"
            />

          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Cancel</Button>
          <Button onClick={handleSubmit} variant="contained" color="primary">
            Add
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

export default IncomeExpense;