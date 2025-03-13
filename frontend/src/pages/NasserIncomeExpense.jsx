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
import { 
  nasserApi, 
  userApi, 
  companyApi, 
  iqamaPriceApi 
} from '../services/api';
import { format, startOfMonth, endOfMonth, subMonths, startOfDay, endOfDay } from 'date-fns';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { saveAs } from 'file-saver';
import { jsPDF } from "jspdf";
import autoTable from 'jspdf-autotable';
import IqamaPriceDialog from '../components/dialogs/IqamaPriceDialog';

// Import our new components
import StatsCards from '../components/income-expense/sections/StatsCards';
import FilterSection from '../components/income-expense/sections/FilterSection';
import IncomeSection from '../components/income-expense/sections/IncomeSection';
import ExpenseSection from '../components/income-expense/sections/ExpenseSection';
import AddEditDialog from '../components/income-expense/dialogs/AddEditDialog';
import DeleteConfirmDialog from '../components/income-expense/dialogs/DeleteConfirmDialog';
import ExportDialog from '../components/income-expense/dialogs/ExportDialog';

function NasserIncomeExpense() {
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
      const dateFilter = {
        startDate: incomeFilters.dateRange.start.toISOString(),
        endDate: incomeFilters.dateRange.end.toISOString()
      };

      // Get income data
      const incomeResponse = incomeFilters.referredBy !== 'all'
        ? await nasserApi.getFilteredIncome({
            ...dateFilter,
            referredBy: incomeFilters.referredBy
          })
        : await nasserApi.getIncomeByDateRange(dateFilter.startDate, dateFilter.endDate);

      // Get expense data
      const expenseResponse = await nasserApi.getFilteredExpense({
        ...dateFilter,
        expenseType: expenseFilters.expenseType !== 'all' ? expenseFilters.expenseType : undefined
      });

      // Update state with response data
      setIncomes(incomeResponse.data || []);
      setExpenses(expenseResponse.data || []);

      // Calculate totals
      const totalInc = (incomeResponse.data || []).reduce((sum, item) => sum + item.amount, 0);
      const totalExp = (expenseResponse.data || []).reduce((sum, item) => sum + item.amount, 0);
      setTotalIncome(totalInc);
      setTotalExpense(totalExp);

      // Calculate last month's data
      const lastMonthStart = startOfMonth(subMonths(new Date(), 1));
      const lastMonthEnd = endOfMonth(subMonths(new Date(), 1));
      
      const lastMonthIncomeResponse = await nasserApi.getIncomeByDateRange(
        lastMonthStart.toISOString(),
        lastMonthEnd.toISOString()
      );
      const lastMonthExpenseResponse = await nasserApi.getExpenseByDateRange(
        lastMonthStart.toISOString(),
        lastMonthEnd.toISOString()
      );

      setLastMonthIncome((lastMonthIncomeResponse.data || []).reduce((sum, item) => sum + item.amount, 0));
      setLastMonthExpense((lastMonthExpenseResponse.data || []).reduce((sum, item) => sum + item.amount, 0));

    } catch (error) {
      console.error('Error fetching data:', error);
      setError('Failed to load data. Please try again later.');
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

  const handleDeleteClick = (item, type) => {
    setItemToDelete({ ...item, type });
    setDeleteConfirmOpen(true);
  };

  const handleDelete = async () => {
    try {
      if (itemToDelete.type === 'income') {
        await nasserApi.delete(itemToDelete._id, 'income');
      } else {
        await nasserApi.delete(itemToDelete._id, 'expense');
      }
      setDeleteConfirmOpen(false);
      fetchData();
    } catch (error) {
      console.error('Error deleting record:', error);
      setError(error.response?.data?.message || 'Failed to delete record');
    }
  };

  const handleSubmit = async (formData) => {
    try {
      setError('');
      
      // If it's an income entry, we need to get the mainPerson
      if (dialogType === 'income') {
        // First find the individual by iqamaNumber to get their company and mainPerson
        const individualsResponse = await userApi.getByIqamaNumber(formData.iqamaNumber);
        const individual = individualsResponse.data;
        
        if (!individual) {
          setError('No individual found with this iqama number');
          return;
        }

        await nasserApi.create({
          ...formData,
          referredBy: user.username,
          mainPerson: individual.company.mainPerson
        });
      } else {
        // For expenses, we'll create with Nasser's mainPerson ID
        await nasserApi.create({
          ...formData,
          name: 'General Purpose',
          mainPerson: '67d09798726e5a47c4caf071', // Nasser's mainPerson ID
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

  const handleExpenseSort = (field) => {
    setExpenseSortField(field);
    setExpenseSortOrder(currentOrder => currentOrder === 'asc' ? 'desc' : 'asc');
  };

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
      console.log('Fetching referred by list...');
      const response = await nasserApi.getReferredByList();
      console.log('Referred by list:', response.data);
      setReferredByList(response.data);
    } catch (error) {
      console.error('Error fetching referred by list:', error);
      setError('Error fetching referred by options');
    }
  };

  const generatePDF = async () => {
    try {
      console.log('Starting PDF generation...');
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
        const response = await nasserApi.getFilteredIncome({
          ...dateFilter,
          referredBy: selectedReferredBy === 'all' ? null : selectedReferredBy
        });
        data = response.data;
      } else {
        const response = await nasserApi.getFilteredExpense(dateFilter);
        data = response.data;
      }

      // Create PDF document with slightly larger margins
      const doc = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4',
        margins: { top: 20, right: 20, bottom: 20, left: 20 }
      });
      
      // Add decorative header bar
      doc.setFillColor(0, 102, 204);
      doc.rect(0, 0, doc.internal.pageSize.width, 15, 'F');
      
      // Add company logo or name at the top with better spacing
      doc.setFontSize(28);
      doc.setTextColor(0, 102, 204);
      doc.text("NASSER CONTRACTING", doc.internal.pageSize.width/2, 30, { align: 'center' });
      
      // Add subtle divider
      doc.setDrawColor(0, 102, 204);
      doc.setLineWidth(0.5);
      doc.line(20, 35, doc.internal.pageSize.width - 20, 35);
      
      // Add report title with better styling
      doc.setFontSize(22);
      doc.setTextColor(51, 51, 51);
      doc.text(
        `${exportType.charAt(0).toUpperCase() + exportType.slice(1)} Report`,
        doc.internal.pageSize.width/2,
        45,
        { align: 'center' }
      );

      // Add report metadata with improved layout
      doc.setFontSize(11);
      doc.setTextColor(102, 102, 102);
      const reportMetadata = [
        `Period: ${dateFilterType === 'range' 
          ? `${format(exportStartDate, 'dd MMMM yyyy')} - ${format(exportEndDate, 'dd MMMM yyyy')}`
          : format(exportSpecificDate, 'dd MMMM yyyy')}`,
        exportType === 'income' && selectedReferredBy !== 'all' ? `Referred By: ${selectedReferredBy}` : null
      ].filter(Boolean);

      reportMetadata.forEach((text, index) => {
        doc.text(text, doc.internal.pageSize.width/2, 55 + (index * 6), { align: 'center' });
      });

      if (!data || data.length === 0) {
        // Styled "No Data Available" message
        doc.setFillColor(245, 245, 245);
        doc.roundedRect(20, 70, doc.internal.pageSize.width - 40, 30, 3, 3, 'F');
        doc.setFontSize(16);
        doc.setTextColor(150, 150, 150);
        doc.text(
          "No data available for the selected period",
          doc.internal.pageSize.width/2,
          88,
          { align: 'center' }
        );
      } else {
        // Add summary section with improved styling
        const total = data.reduce((sum, item) => sum + item.amount, 0);
        doc.setFillColor(240, 245, 255); // Light blue background
        doc.roundedRect(20, 70, doc.internal.pageSize.width - 40, 25, 3, 3, 'F');
        doc.setTextColor(0, 102, 204);
        doc.setFontSize(12);
        doc.text(`Total ${exportType}: `, 30, 85);
        doc.setFontSize(14);
        doc.text(`SAR ${total.toFixed(2)}`, 65, 85);
        doc.setFontSize(12);
        doc.text(`Number of Entries: ${data.length}`, doc.internal.pageSize.width - 30, 85, { align: 'right' });

        // Configure and add table with improved styling
        const tableColumns = exportType === 'income' 
          ? [
              { header: 'Date', dataKey: 'date' },
              { header: 'Name', dataKey: 'name' },
              { header: 'Iqama Number', dataKey: 'iqama' },
              { header: 'Referred By', dataKey: 'referredBy' },
              { header: 'Amount (SR)', dataKey: 'amount' }
            ]
          : [
              { header: 'Date', dataKey: 'date' },
              { header: 'Name', dataKey: 'name' },
              { header: 'Amount (SR)', dataKey: 'amount' }
            ];

        const tableRows = data.map(item => ({
          date: format(new Date(item.createdAt), 'dd MMMM yyyy'),
          name: item.name,
          iqama: item.iqamaNumber || '-',
          referredBy: item.referredBy || '-',
          amount: item.amount.toFixed(2)
        }));

        doc.autoTable({
          columns: tableColumns,
          body: tableRows,
          startY: 100,
          styles: {
            fontSize: 10,
            cellPadding: 4,
            lineColor: [240, 240, 240],
            lineWidth: 0.1,
          },
          headStyles: {
            fillColor: [0, 102, 204],
            textColor: 255,
            fontSize: 11,
            fontStyle: 'bold',
            halign: 'center',
            cellPadding: 5
          },
          columnStyles: {
            date: { halign: 'center' },
            amount: { halign: 'right', fontStyle: 'bold' },
            iqama: { halign: 'center' }
          },
          alternateRowStyles: {
            fillColor: [249, 250, 251]
          },
          showHead: 'everyPage',
          didDrawPage: function(data) {
            // Header on every page
            doc.setFillColor(0, 102, 204);
            doc.rect(0, 0, doc.internal.pageSize.width, 15, 'F');
            
            // Company name in header
            doc.setFontSize(10);
            doc.setTextColor(255, 255, 255);
            doc.text(
              'NASSER CONTRACTING',
              doc.internal.pageSize.width - 20,
              10,
              { align: 'right' }
            );
            
            // Generation date in header
            doc.text(
              `Generated: ${format(new Date(), 'dd MMMM yyyy hh:mm a')}`,
              20,
              10
            );
            
            // Footer with page numbers
            doc.setFontSize(9);
            doc.setTextColor(128, 128, 128);
            doc.text(
              `Page ${doc.internal.getCurrentPageInfo().pageNumber} of ${doc.internal.getNumberOfPages()}`,
              doc.internal.pageSize.width/2,
              doc.internal.pageSize.height - 10,
              { align: 'center' }
            );
          },
          margin: { top: 30, bottom: 30, left: 20, right: 20 }
        });

        // Add footer with total
        const finalY = doc.autoTable.previous.finalY;
        doc.setFillColor(0, 102, 204);
        doc.roundedRect(20, finalY + 5, doc.internal.pageSize.width - 40, 20, 2, 2, 'F');
        doc.setFontSize(12);
        doc.setTextColor(255, 255, 255);
        doc.text(
          `Total Amount: SAR ${total.toFixed(2)}`,
          doc.internal.pageSize.width - 30,
          finalY + 17,
          { align: 'right' }
        );
      }

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
    setDateFilterType('range');
    setExportStartDate(startOfMonth(new Date()));
    setExportEndDate(endOfMonth(new Date()));
    setExportSpecificDate(new Date());
    setSelectedReferredBy('all');
    setExportDialogOpen(true);
  };

  const handleExport = () => {
    generatePDF();
  };

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleExpensePageChange = (event, newPage) => {
    setExpensePage(newPage);
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

  const handleUpdatePrice = async (newPrice) => {
    try {
      await iqamaPriceApi.update(newPrice);
      await loadIqamaPrice();
    } catch (error) {
      console.error('Error updating IQAMA price:', error);
      throw new Error('Failed to update IQAMA price. Please try again.');
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
          <Typography variant="h5" component="h1">
            {t('incomeExpense.title')}
          </Typography>
          <Box sx={{ flexGrow: 1 }} />
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
              onEdit={handleEdit}
              onDelete={handleDeleteClick}
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
              onEdit={handleEdit}
              onDelete={handleDeleteClick}
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
          onConfirm={handleDelete}
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
          onExport={handleExport}
        />

        <IqamaPriceDialog
          open={isIqamaPriceDialogOpen}
          currentPrice={iqamaPrice}
          onClose={() => setIsIqamaPriceDialogOpen(false)}
          onSave={handleUpdatePrice}
        />
      </Box>
    </Container>
  );
}

export default NasserIncomeExpense;