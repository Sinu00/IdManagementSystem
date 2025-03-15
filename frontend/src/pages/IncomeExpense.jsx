import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
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
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  RadioGroup,
  FormControlLabel,
  Radio,
  TablePagination,
  Tooltip
} from '@mui/material';
import {
  ArrowBack as ArrowBackIcon,
  AccountBalanceWallet as WalletIcon,
  Add as AddIcon,
  TrendingUp as IncomeIcon,
  TrendingDown as ExpenseIcon,
  AttachMoney as MoneyIcon,
  Receipt as ReceiptIcon,
  DateRange as DateIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  FilterAlt as FilterIcon,
  MonetizationOn as MonetizationIcon,
  People as PeopleIcon,
  Refresh as RefreshIcon
} from '@mui/icons-material';
import { useAuth } from '../context/AuthContext';
import { incomeApi, expenseApi, iqamaPriceApi, individualApi, companyApi } from '../services/api';
import { format, startOfMonth, endOfMonth, subMonths, startOfDay, endOfDay } from 'date-fns';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { saveAs } from 'file-saver';
import { jsPDF } from "jspdf";
import autoTable from 'jspdf-autotable';
import { generateReport } from '../components/income-expense/pdfgeneration/generateReport';

// Import our new components
import StatsCards from '../components/income-expense/sections/StatsCards';
import FilterSection from '../components/income-expense/sections/FilterSection';
import IncomeSection from '../components/income-expense/sections/IncomeSection';
import ExpenseSection from '../components/income-expense/sections/ExpenseSection';
import AddEditDialog from '../components/income-expense/dialogs/AddEditDialog';
import DeleteConfirmDialog from '../components/income-expense/dialogs/DeleteConfirmDialog';
import ExportDialog from '../components/income-expense/dialogs/ExportDialog';
import IqamaPriceDialog from '../components/dialogs/IqamaPriceDialog';

function IncomeExpense() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { t } = useTranslation();
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
    iqamaNumber: '', // only for income
    referredBy: '',
    company: '', // for expense
    expenseType: 'other', // for expense
    specification: '' // for other expense type
  });
  const [error, setError] = useState('');
  const [sortField, setSortField] = useState('createdAt');
  const [sortOrder, setSortOrder] = useState('desc');
  const [expenseSortField, setExpenseSortField] = useState('createdAt');
  const [expenseSortOrder, setExpenseSortOrder] = useState('desc');
  const [editData, setEditData] = useState(null);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState(null);
  const [exportDialogOpen, setExportDialogOpen] = useState(false);
  const [exportType, setExportType] = useState('income');
  const [dateFilterType, setDateFilterType] = useState('range');
  const [exportStartDate, setExportStartDate] = useState(startOfMonth(new Date()));
  const [exportEndDate, setExportEndDate] = useState(endOfMonth(new Date()));
  const [exportSpecificDate, setExportSpecificDate] = useState(new Date());
  const [referredByList, setReferredByList] = useState([]);
  const [selectedReferredBy, setSelectedReferredBy] = useState('all');
  const [page, setPage] = useState(0);
  const [rowsPerPage] = useState(10);
  const [expensePage, setExpensePage] = useState(0);
  const [expenseRowsPerPage] = useState(10);
  const [incomeFilters, setIncomeFilters] = useState({
    dateRange: {
      start: startOfMonth(new Date()),
      end: endOfMonth(new Date())
    },
    nameSearch: '',
    referredBy: 'all'
  });
  const [expenseFilters, setExpenseFilters] = useState({
    dateRange: {
      start: startOfMonth(new Date()),
      end: endOfMonth(new Date())
    },
    nameSearch: '',
    expenseType: 'all'
  });
  const [showIncomeFilters, setShowIncomeFilters] = useState(false);
  const [showExpenseFilters, setShowExpenseFilters] = useState(false);
  const [iqamaPrice, setIqamaPrice] = useState(5000);
  const [isIqamaPriceDialogOpen, setIsIqamaPriceDialogOpen] = useState(false);
  const [companies, setCompanies] = useState([]);

  const calculatePercentageChange = (current, previous) => {
    if (previous === 0) return current > 0 ? 100 : 0;
    return ((current - previous) / previous) * 100;
  };

  useEffect(() => {
    fetchData();
    fetchReferredByList();
    loadIqamaPrice();
    fetchCompanies();
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

      setIncomes(incomeRes.data || []);
      setExpenses(expenseRes.data || []);
      
      const currentMonthIncomeTotal = (incomeRes.data || []).reduce((sum, item) => sum + (item.amount || 0), 0);
      const currentMonthExpenseTotal = (expenseRes.data || []).reduce((sum, item) => sum + (item.amount || 0), 0);
      const lastMonthIncomeTotal = (lastMonthIncomeRes.data || []).reduce((sum, item) => sum + (item.amount || 0), 0);
      const lastMonthExpenseTotal = (lastMonthExpenseRes.data || []).reduce((sum, item) => sum + (item.amount || 0), 0);

      setTotalIncome(currentMonthIncomeTotal);
      setTotalExpense(currentMonthExpenseTotal);
      setLastMonthIncome(lastMonthIncomeTotal);
      setLastMonthExpense(lastMonthExpenseTotal);
    } catch (error) {
      console.error('Error fetching data:', error);
      setError('Failed to load data. Please try again later.');
      // Set default values in case of error
      setTotalIncome(0);
      setTotalExpense(0);
      setLastMonthIncome(0);
      setLastMonthExpense(0);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenDialog = (type) => {
    setDialogType(type);
    setFormData({
      name: '',
      amount: '',
      iqamaNumber: '',
      referredBy: '',
      company: '',
      expenseType: 'other',
      specification: ''
    });
    setDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setEditData(null);
    setError('');
  };

  const handleEdit = (item, type) => {
    setDialogType(type);
    setEditData(item);
    setFormData({
      name: item.name,
      amount: item.amount.toString(),
      iqamaNumber: item.iqamaNumber || '',
      referredBy: item.referredBy || '',
      company: item.company || '',
      expenseType: item.expenseType || 'other',
      specification: item.expenseType || ''
    });
    setDialogOpen(true);
  };

  const handleDeleteClick = (item) => {
    setItemToDelete(item);
    setDeleteConfirmOpen(true);
  };

  const handleExpensePageChange = (event, newPage) => {
    setExpensePage(newPage);
  };

  const handleExpenseSort = (field) => {
    if (field === expenseSortField) {
      setExpenseSortOrder(expenseSortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setExpenseSortField(field);
      setExpenseSortOrder('asc');
    }
  };

  const handleConfirmDelete = async () => {
    if (!itemToDelete) return;

    try {
      setLoading(true);
      if (itemToDelete.type === 'income') {
        await incomeApi.delete(itemToDelete._id);
      } else {
        await expenseApi.delete(itemToDelete._id);
      }
      setDeleteConfirmOpen(false);
      setItemToDelete(null);
      fetchData();
    } catch (error) {
      console.error('Error deleting item:', error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleIqamaPriceChange = async (newPrice) => {
    try {
      await iqamaPriceApi.updateIqamaPrice(newPrice);
      setIqamaPrice(newPrice);
      setIsIqamaPriceDialogOpen(false);
    } catch (error) {
      console.error('Error updating iqama price:', error);
    }
  };

  const handleSubmit = async (formData) => {
    try {
      setError('');
      
      // If it's an income entry, we need to get the mainPerson
      if (dialogType === 'income') {
        // First find the individual by iqamaNumber to get their company and mainPerson
        const individualsResponse = await individualApi.getByIqamaNumber(formData.iqamaNumber);
        const individual = individualsResponse.data;
        
        if (!individual) {
          setError('No individual found with this iqama number');
          return;
        }

        await incomeApi.create({
          ...formData,
          referredBy: user.username,
          mainPerson: individual.company.mainPerson
        });
      } else {
        // For expenses, we'll create with the other mainPerson ID
        await expenseApi.create({
          ...formData,
          name: 'General Purpose',
          mainPerson: '67b22c3748dc9b1348b1d635', // Other mainPerson ID
          expenseType: formData.expenseType,
          specification: formData.expenseType === 'other' ? formData.specification : formData.expenseType
        });
      }

      handleCloseDialog();
      fetchData();
    } catch (error) {
      console.error('Error creating record:', error);
      setError(error.response?.data?.message || 'Failed to create record');
    }
  };

  const handleSort = (field) => {
    setSortField(field);
    setSortOrder(currentOrder => currentOrder === 'asc' ? 'desc' : 'asc');
  };

  const applyFilters = (data, type) => {
    const filters = type === 'income' ? incomeFilters : expenseFilters;
    return data.filter(item => {
      const dateMatch = new Date(item.createdAt) >= startOfDay(filters.dateRange.start) &&
                       new Date(item.createdAt) <= endOfDay(filters.dateRange.end);
      
      const nameMatch = item.name.toLowerCase().includes(filters.nameSearch.toLowerCase());
      
      const referredByMatch = type === 'income' ? 
        (filters.referredBy === 'all' || item.referredBy === filters.referredBy) : true;
      
      const expenseTypeMatch = type === 'expense' ?
        (filters.expenseType === 'all' || item.expenseType === filters.expenseType) : true;
      
      return dateMatch && nameMatch && referredByMatch && expenseTypeMatch;
    });
  };

  const sortedIncomes = useMemo(() => {
    const filtered = applyFilters(incomes, 'income');
    return [...filtered].sort((a, b) => {
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
  }, [incomes, sortField, sortOrder, incomeFilters]);

  const sortedExpenses = useMemo(() => {
    const filtered = applyFilters(expenses, 'expense');
    return [...filtered].sort((a, b) => {
      let comparison = 0;
      switch (expenseSortField) {
        case 'dateAndTime':
        case 'createdAt':
          comparison = new Date(a.createdAt) - new Date(b.createdAt);
          break;
        case 'amount':
          comparison = a.amount - b.amount;
          break;
        case 'company.name':
          comparison = (a.company?.name || '').localeCompare(b.company?.name || '');
          break;
        case 'expenseType':
          comparison = (a.expenseType || '').localeCompare(b.expenseType || '');
          break;
        default:
          comparison = 0;
      }
      return expenseSortOrder === 'asc' ? comparison : -comparison;
    });
  }, [expenses, expenseSortField, expenseSortOrder, expenseFilters]);

  const formatDate = (dateString) => {
    try {
      const date = new Date(dateString);
      return `${format(date, 'MMM')} ${date.getDate()}\n${date.getFullYear()}`;
    } catch (error) {
      console.error('Date formatting error:', error);
      return 'Invalid Date';
    }
  };

  const fetchReferredByList = async () => {
    try {
      const response = await incomeApi.getReferredByList();
      setReferredByList(response.data);
    } catch (error) {
      console.error('Error fetching referred by list:', error);
      setError('Error fetching referred by options');
    }
  };

  const generatePDF = async () => {
    try {
      setError('');
      let data;
      const dateFilter = dateFilterType === 'range' 
        ? { 
            startDate: exportStartDate.toISOString(), 
            endDate: exportEndDate.toISOString() 
          }
        : { 
            startDate: startOfDay(exportSpecificDate).toISOString(), 
            endDate: endOfDay(exportSpecificDate).toISOString() 
          };

      if (exportType === 'income') {
        const response = await incomeApi.getFilteredIncome({
          ...dateFilter,
          referredBy: selectedReferredBy === 'all' ? null : selectedReferredBy
        });
        data = response.data;
      } else {
        const response = await expenseApi.getFilteredExpense(dateFilter);
        data = response.data;
      }

      const doc = await generateReport(exportType, data, {
        dateFilterType,
        startDate: exportStartDate,
        endDate: exportEndDate,
        specificDate: exportSpecificDate,
        selectedReferredBy
      });

      // Save the PDF
      doc.save(`${exportType}_report_${format(new Date(), 'dd_MM_yyyy')}.pdf`);
      setExportDialogOpen(false);
      setError('');

    } catch (error) {
      console.error('PDF Generation Error:', error);
      setError('Error generating PDF: ' + (error.message || 'Unknown error'));
    }
  };

  useEffect(() => {
    if (exportDialogOpen && exportType === 'income') {
      fetchReferredByList();
    }
  }, [exportDialogOpen, exportType]);

  const handleExportClick = (type) => {
    setExportType(type);
    setExportDialogOpen(true);
  };

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleFilterChange = (type, field, value) => {
    if (type === 'income') {
      setIncomeFilters(prev => 
        field === 'dateRange' 
          ? { ...prev, dateRange: value }
          : { ...prev, [field]: value }
      );
    } else {
      setExpenseFilters(prev => 
        field === 'dateRange' 
          ? { ...prev, dateRange: value }
          : { ...prev, [field]: value }
      );
    }
  };

  const loadIqamaPrice = async () => {
    try {
      const response = await iqamaPriceApi.getCurrent();
      setIqamaPrice(response.data.price);
    } catch (error) {
      console.error('Error loading IQAMA price:', error);
      setIqamaPrice(5000);
    }
  };

  const fetchCompanies = async () => {
    try {
      const response = await companyApi.getAll();
      setCompanies(response.data);
    } catch (error) {
      console.error('Error fetching companies:', error);
      setError('Error fetching companies');
    }
  };

  return (
    <Container maxWidth="xl">
      <Box sx={{ py: 3 }}>
        {/* Header */}
        <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 3 }}>
          <IconButton onClick={() => navigate(-1)} size="small">
            <ArrowBackIcon />
          </IconButton>
          <Typography 
            variant="h5" 
            component="h1"
          sx={{ 
              fontWeight: 700,
              fontSize: '1.7rem',
              letterSpacing: '0.5px'
            }}
          >
                {t('incomeExpense.title')}
              </Typography>
              <Box sx={{ flexGrow: 1 }} />
          {user?.username == "Suhail" && (
            <Button
              startIcon={<PeopleIcon />}
              onClick={() => navigate('/users')}
              variant="outlined"
              size="small"
              sx={{ mr: 1 }}
            >
              {t('incomeExpense.buttons.manageUsers')}
            </Button>
          )}
          <Button
            startIcon={<WalletIcon />}
            onClick={() => setIsIqamaPriceDialogOpen(true)}
            variant="outlined"
            size="small"
          >
            {t('incomeExpense.buttons.setIqamaPrice', { price: iqamaPrice })}
          </Button>
                </Stack>

        {/* Stats Cards */}
        <StatsCards
          totalIncome={totalIncome}
          totalExpense={totalExpense}
          lastMonthIncome={lastMonthIncome}
          lastMonthExpense={lastMonthExpense}
          calculatePercentageChange={calculatePercentageChange}
        />

        <Grid container spacing={3} sx={{ mt: 3 }}>
          {/* Income Section */}
          <Grid item xs={12} lg={6}>
            <IncomeSection
              loading={loading}
              incomes={sortedIncomes}
              showFilters={showIncomeFilters}
                    filters={incomeFilters}
                    onFilterChange={handleFilterChange}
                    referredByList={referredByList}
              onToggleFilters={() => setShowIncomeFilters(!showIncomeFilters)}
              onRefresh={fetchData}
              onAdd={() => handleOpenDialog('income')}
              onExport={() => handleExportClick('income')}
              onEdit={(item) => handleEdit(item, 'income')}
              onDelete={(item) => handleDeleteClick({ ...item, type: 'income' })}
                    page={page}
                    onPageChange={handleChangePage}
                    rowsPerPage={rowsPerPage}
              sortField={sortField}
              sortOrder={sortOrder}
              onSort={handleSort}
              totalIncome={totalIncome}
              lastMonthIncome={lastMonthIncome}
            />
          </Grid>

          {/* Expense Section */}
          <Grid item xs={12} lg={6}>
            <ExpenseSection
              loading={loading}
              expenses={sortedExpenses}
              showFilters={showExpenseFilters}
                    filters={expenseFilters}
                    onFilterChange={handleFilterChange}
              onToggleFilters={() => setShowExpenseFilters(!showExpenseFilters)}
              onRefresh={fetchData}
              onAdd={() => handleOpenDialog('expense')}
              onExport={() => handleExportClick('expense')}
              onEdit={(item) => handleEdit(item, 'expense')}
              onDelete={(item) => handleDeleteClick({ ...item, type: 'expense' })}
                    page={expensePage}
              onPageChange={handleExpensePageChange}
                    rowsPerPage={expenseRowsPerPage}
              sortField={expenseSortField}
              sortOrder={expenseSortOrder}
              onSort={handleExpenseSort}
              totalExpense={totalExpense}
              lastMonthExpense={lastMonthExpense}
            />
          </Grid>
        </Grid>

        {/* Dialogs */}
        <AddEditDialog
          open={dialogOpen}
          type={dialogType}
          data={editData}
          onClose={() => {
            setDialogOpen(false);
            setEditData(null);
            setError('');
          }}
          onSubmit={handleSubmit}
          error={error}
          companies={companies}
          iqamaPrice={iqamaPrice}
        />

        <DeleteConfirmDialog
        open={deleteConfirmOpen}
          type={itemToDelete?.type}
          onClose={() => {
            setDeleteConfirmOpen(false);
            setItemToDelete(null);
          }}
          onConfirm={handleConfirmDelete}
        />

        <ExportDialog
          open={exportDialogOpen}
          type={exportType}
          dateFilterType={dateFilterType}
          exportStartDate={exportStartDate}
          exportEndDate={exportEndDate}
          exportSpecificDate={exportSpecificDate}
          selectedReferredBy={selectedReferredBy}
          referredByList={referredByList}
          onClose={() => setExportDialogOpen(false)}
          onDateFilterTypeChange={(value) => setDateFilterType(value)}
          onStartDateChange={setExportStartDate}
          onEndDateChange={setExportEndDate}
          onSpecificDateChange={setExportSpecificDate}
          onReferredByChange={(value) => setSelectedReferredBy(value)}
          onExport={generatePDF}
        />

      <IqamaPriceDialog
        open={isIqamaPriceDialogOpen}
        currentPrice={iqamaPrice}
          onClose={() => setIsIqamaPriceDialogOpen(false)}
          onSave={handleIqamaPriceChange}
      />
    </Box>
    </Container>
  );
}

export default IncomeExpense;