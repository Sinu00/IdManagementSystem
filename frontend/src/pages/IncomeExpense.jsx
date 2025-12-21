import { useState, useEffect, useMemo, useCallback } from 'react';
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
import { incomeApi, expenseApi, iqamaPriceApi, individualApi, companyApi, mainPersonApi } from '../services/api';
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
  const [incomes, setIncomes] = useState([]);
  const [expenses, setExpenses] = useState([]);
  const [totalIncome, setTotalIncome] = useState(0);
  const [totalExpense, setTotalExpense] = useState(0);
  const [lastMonthIncome, setLastMonthIncome] = useState(0);
  const [lastMonthExpense, setLastMonthExpense] = useState(0);
  const [totalBalance, setTotalBalance] = useState(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogType, setDialogType] = useState('income'); // 'income' or 'expense'
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    amount: '',
    iqamaNumber: '', // only for income
    referredBy: '',
    company: '', // for expense
    expenseType: 'other', // for expense
    specification: '', // for other expense type
    transactionDate: ''
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
  const [mainPersonList, setMainPersonList] = useState([]);
  const [selectedMainPerson, setSelectedMainPerson] = useState('all');
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

      // Get total balance
      const balanceRes = await incomeApi.getTotalBalance();
      setTotalBalance(balanceRes.data);

      // Get last month data for comparison
      const [lastMonthIncomeRes, lastMonthExpenseRes] = await Promise.all([
        incomeApi.getByDateRange(lastMonthStart.toISOString(), lastMonthEnd.toISOString()),
        expenseApi.getByDateRange(lastMonthStart.toISOString(), lastMonthEnd.toISOString())
      ]);

      const lastMonthIncomeTotal = (lastMonthIncomeRes.data || []).reduce((sum, item) => sum + (item.amount || 0), 0);
      const lastMonthExpenseTotal = (lastMonthExpenseRes.data || []).reduce((sum, item) => sum + (item.amount || 0), 0);

      setLastMonthIncome(lastMonthIncomeTotal);
      setLastMonthExpense(lastMonthExpenseTotal);

      // Initial data load with current filters
      await Promise.all([
        fetchFilteredData(incomeFilters),
        fetchFilteredExpenseData(expenseFilters)
      ]);

    } catch (error) {
      console.error('Error fetching data:', error);
      setError('Failed to load data. Please try again later.');
      setTotalIncome(0);
      setTotalExpense(0);
      setLastMonthIncome(0);
      setLastMonthExpense(0);
      setTotalBalance(null);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenDialog = (type) => {
    setDialogType(type);
    setFormData({
      name: '',
      description: '',
      amount: '',
      iqamaNumber: '',
      referredBy: '',
      company: '',
      expenseType: 'other',
      specification: '',
      transactionDate: ''
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
      description: item.description || '',
      amount: item.amount.toString(),
      iqamaNumber: item.iqamaNumber || '',
      referredBy: item.referredBy || '',
      company: item.company || '',
      expenseType: item.expenseType || 'other',
      specification: item.expenseType === 'other' ? (item.specification || '') : '',
      transactionDate: item.transactionDate
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
      
      // If it's an income entry
      if (dialogType === 'income') {
        const incomeData = {
          name: formData.name,
          description: formData.description,
          amount: formData.amount,
          referredBy: formData.description, // Use description as referredBy for custom income
          mainPerson: '67d09798726e5a47c4caf072', // Main company mainPerson ID
          isCustomIncome: true,
          iqamaNumber: formData.iqamaNumber || 'N/A',
          transactionDate: formData.transactionDate
        };

        if (editData) {
          await incomeApi.update(editData._id, incomeData);
        } else {
          await incomeApi.create(incomeData);
        }
      } else {
        // For expenses, we'll create with the main company mainPerson ID
        const expenseData = {
          name: 'General Purpose',
          amount: formData.amount,
          expenseType: formData.expenseType,
          specification: formData.expenseType === 'other' ? formData.specification : undefined,
          mainPerson: '67d09798726e5a47c4caf072', // Main company mainPerson ID
          transactionDate: formData.transactionDate
        };
        
        // Only include company if it's not empty
        if (formData.company) {
          expenseData.company = formData.company;
        }

        if (editData) {
          await expenseApi.update(editData._id, expenseData);
        } else {
          await expenseApi.create(expenseData);
        }
      }

      handleCloseDialog();
      fetchData();
    } catch (error) {
      console.error('Error saving record:', error);
      setError(error.response?.data?.message || 'Failed to save record');
    }
  };

  const handleSort = (field) => {
    setSortField(field);
    setSortOrder(currentOrder => currentOrder === 'asc' ? 'desc' : 'asc');
  };

  // Note: Filtering is done on the backend via fetchFilteredData and fetchFilteredExpenseData
  // The incomes and expenses arrays are already filtered, so we only need to sort them here

  const sortedIncomes = useMemo(() => {
    return [...incomes].sort((a, b) => {
      let comparison = 0;
      switch (sortField) {
        case 'dateAndTime':
        case 'transactionDate':
          comparison = new Date(a.transactionDate) - new Date(b.transactionDate);
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

  const sortedExpenses = useMemo(() => {
    return [...expenses].sort((a, b) => {
      let comparison = 0;
      switch (expenseSortField) {
        case 'dateAndTime':
        case 'transactionDate':
          comparison = new Date(a.transactionDate) - new Date(b.transactionDate);
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
  }, [expenses, expenseSortField, expenseSortOrder]);

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

  const fetchMainPersons = async () => {
    try {
      const response = await mainPersonApi.getAll();
      setMainPersonList(response.data || []);
    } catch (error) {
      console.error('Error fetching main persons:', error);
      setError('Error fetching main person options');
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
          referredBy: selectedReferredBy === 'all' ? null : selectedReferredBy,
          mainPerson: selectedMainPerson === 'all' ? null : selectedMainPerson
        });
        data = response.data;
      } else {
        const response = await expenseApi.getFilteredExpense({
          ...dateFilter,
          mainPerson: selectedMainPerson === 'all' ? null : selectedMainPerson
        });
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
    if (exportDialogOpen) {
      if (exportType === 'income') {
        fetchReferredByList();
      }
      fetchMainPersons();
    }
  }, [exportDialogOpen, exportType]);

  const handleExportClick = (type) => {
    setExportType(type);
    setExportDialogOpen(true);
  };

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  // Add debounce function
  const debounce = (func, wait) => {
    let timeout;
    return function executedFunction(...args) {
      const later = () => {
        clearTimeout(timeout);
        func(...args);
      };
      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
    };
  };

  // Create debounced filter handlers
  const debouncedFetchFilteredData = useCallback(
    debounce((filters) => {
      fetchFilteredData(filters);
    }, 500),
    []
  );

  const debouncedFetchFilteredExpenseData = useCallback(
    debounce((filters) => {
      fetchFilteredExpenseData(filters);
    }, 500),
    []
  );

  const handleFilterChange = (type, field, value) => {
    if (type === 'income') {
      setIncomeFilters(prev => {
        const newFilters = { ...prev, [field]: value };
        
        // Use debounced function for name search, immediate for others
        if (field === 'nameSearch') {
          debouncedFetchFilteredData(newFilters);
        } else {
          fetchFilteredData(newFilters);
        }
        
        return newFilters;
      });
    } else {
      setExpenseFilters(prev => {
        const newFilters = { ...prev, [field]: value };
        
        // Use debounced function for name search, immediate for others
        if (field === 'nameSearch') {
          debouncedFetchFilteredExpenseData(newFilters);
        } else {
          fetchFilteredExpenseData(newFilters);
        }
        
        return newFilters;
      });
    }
  };

  const fetchFilteredData = async (filters) => {
    try {
      setLoading(true);
      const response = await incomeApi.getFilteredIncome({
        startDate: filters.dateRange.start.toISOString(),
        endDate: filters.dateRange.end.toISOString(),
        referredBy: filters.referredBy === 'all' ? null : filters.referredBy,
        nameSearch: filters.nameSearch || null
      });
      
      setIncomes(response.data || []);
      
      // Calculate totals for the filtered data
      const filteredTotal = (response.data || []).reduce((sum, item) => sum + (item.amount || 0), 0);
      setTotalIncome(filteredTotal);
      
    } catch (error) {
      console.error('Error fetching filtered data:', error);
      setError('Failed to load filtered data');
    } finally {
      setLoading(false);
    }
  };

  const fetchFilteredExpenseData = async (filters) => {
    try {
      setLoading(true);
      const response = await expenseApi.getFilteredExpense({
        startDate: filters.dateRange.start.toISOString(),
        endDate: filters.dateRange.end.toISOString(),
        expenseType: filters.expenseType === 'all' ? null : filters.expenseType,
        nameSearch: filters.nameSearch || null
      });
      console.log(response.data);
      setExpenses(response.data || []);

      
      // Calculate totals for the filtered data
      const filteredTotal = (response.data || []).reduce((sum, item) => sum + (item.amount || 0), 0);
      setTotalExpense(filteredTotal);
      
    } catch (error) {
      console.error('Error fetching filtered expense data:', error);
      setError('Failed to load filtered expense data');
    } finally {
      setLoading(false);
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
          <Box>
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
            <Typography 
              variant="subtitle1" 
              color="text.secondary"
              sx={{ mt: 0.5 }}
            >
              {format(incomeFilters.dateRange.start, 'MMMM yyyy')}
            </Typography>
          </Box>
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
          totalBalance={totalBalance}
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
          selectedMainPerson={selectedMainPerson}
          mainPersonList={mainPersonList}
          onClose={() => setExportDialogOpen(false)}
          onDateFilterTypeChange={(value) => setDateFilterType(value)}
          onStartDateChange={setExportStartDate}
          onEndDateChange={setExportEndDate}
          onSpecificDateChange={setExportSpecificDate}
          onReferredByChange={(value) => setSelectedReferredBy(value)}
          onMainPersonChange={(value) => setSelectedMainPerson(value)}
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