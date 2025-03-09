import { useState, useEffect, useMemo, memo } from 'react';
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
import IqamaPriceDialog from '../components/dialogs/IqamaPriceDialog';

// Create a memoized FilterSection component outside the main component
const FilterSection = memo(({ type, visible, filters, onFilterChange, referredByList = [] }) => (
  <Box sx={{ 
    mb: 3,
    display: visible ? 'block' : 'none'
  }}>
    <Paper sx={{ p: 2 }}>
      <Grid container spacing={2}>
        <Grid item xs={12} md={4}>
          <TextField
            fullWidth
            size="small"
            label="Search by name"
            value={filters.nameSearch}
            onChange={(e) => onFilterChange(type, 'nameSearch', e.target.value)}
          />
        </Grid>
        <Grid item xs={12} md={4}>
          <LocalizationProvider dateAdapter={AdapterDateFns}>
            <DatePicker
              label="From Date"
              value={filters.dateRange.start}
              onChange={(newValue) => onFilterChange(type, 'dateRange', { 
                ...filters.dateRange, 
                start: newValue 
              })}
              slotProps={{ 
                textField: { 
                  size: 'small', 
                  fullWidth: true
                }
              }}
              format="dd/MM/yyyy"
            />
          </LocalizationProvider>
        </Grid>
        <Grid item xs={12} md={4}>
          <LocalizationProvider dateAdapter={AdapterDateFns}>
            <DatePicker
              label="To Date"
              value={filters.dateRange.end}
              onChange={(newValue) => onFilterChange(type, 'dateRange', { 
                ...filters.dateRange, 
                end: newValue 
              })}
              slotProps={{ 
                textField: { 
                  size: 'small', 
                  fullWidth: true
                }
              }}
              format="dd/MM/yyyy"
            />
          </LocalizationProvider>
        </Grid>
        {type === 'income' && (
          <Grid item xs={12} md={4}>
            <FormControl fullWidth size="small">
              <InputLabel>Referred By</InputLabel>
              <Select
                value={filters.referredBy}
                label="Referred By"
                onChange={(e) => onFilterChange(type, 'referredBy', e.target.value)}
              >
                <MenuItem value="all">All</MenuItem>
                {referredByList.map((ref) => (
                  <MenuItem key={ref} value={ref}>{ref}</MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
        )}
        {type === 'expense' && (
          <Grid item xs={12} md={4}>
            <FormControl fullWidth size="small">
              <InputLabel>Expense Type</InputLabel>
              <Select
                value={filters.expenseType}
                label="Expense Type"
                onChange={(e) => onFilterChange(type, 'expenseType', e.target.value)}
              >
                <MenuItem value="all">All Types</MenuItem>
                <MenuItem value="cr">CR Amount</MenuItem>
                <MenuItem value="qiwa">Qiwa Amount</MenuItem>
                <MenuItem value="muqeem">Muqeem Amount</MenuItem>
                <MenuItem value="saudi">Saudi Amount</MenuItem>
                <MenuItem value="efa">EFA Amount</MenuItem>
                <MenuItem value="other">Other</MenuItem>
              </Select>
            </FormControl>
          </Grid>
        )}
      </Grid>
    </Paper>
  </Box>
));

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
        await incomeApi.delete(itemToDelete._id);
      } else {
        await expenseApi.delete(itemToDelete._id);
      }
      setDeleteConfirmOpen(false);
      fetchData();
    } catch (error) {
      setError(error.response?.data?.message || 'An error occurred');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
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
          mainPerson: individual.company.mainPerson
        });
      } else {
        // For expenses, we'll create without company and mainPerson
        const { company, ...expenseData } = formData; // Remove company field
        await expenseApi.create({
          ...expenseData,
          name: 'General Purpose', // Set default name for general expenses
          expenseType: 'other', // Always set expenseType as 'other' for custom types
          specification: formData.expenseType === 'other' ? formData.specification : formData.expenseType // Store the actual type in specification
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
      const response = await incomeApi.getReferredByList();
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
        const response = await incomeApi.getFilteredIncome({
          ...dateFilter,
          referredBy: selectedReferredBy === 'all' ? null : selectedReferredBy
        });
        data = response.data;
      } else {
        const response = await expenseApi.getFilteredExpense(dateFilter);
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
      doc.text("NAMORA CONTRACTING", doc.internal.pageSize.width/2, 30, { align: 'center' });
      
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
              'NAMORA CONTRACTING',
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
    setExportDialogOpen(true);
  };

  const ExportDialog = () => (
    <Dialog
      open={exportDialogOpen}
      onClose={() => setExportDialogOpen(false)}
      maxWidth="sm"
      fullWidth
    >
      <DialogTitle>
        Export {exportType === 'income' ? 'Income' : 'Expense'} Report
      </DialogTitle>
      <DialogContent>
        <Box sx={{ mt: 2 }}>
          <FormControl component="fieldset" sx={{ mb: 2 }}>
            <RadioGroup
              value={dateFilterType}
              onChange={(e) => setDateFilterType(e.target.value)}
            >
              <FormControlLabel value="range" control={<Radio />} label="Date Range" />
              <FormControlLabel value="specific" control={<Radio />} label="Specific Date" />
            </RadioGroup>
          </FormControl>

          {dateFilterType === 'range' ? (
            <Grid container spacing={2}>
              <Grid item xs={6}>
                <LocalizationProvider dateAdapter={AdapterDateFns}>
                  <DatePicker
                    label="Start Date"
                    value={exportStartDate}
                    onChange={setExportStartDate}
                  />
                </LocalizationProvider>
              </Grid>
              <Grid item xs={6}>
                <LocalizationProvider dateAdapter={AdapterDateFns}>
                  <DatePicker
                    label="End Date"
                    value={exportEndDate}
                    onChange={setExportEndDate}
                  />
                </LocalizationProvider>
              </Grid>
            </Grid>
          ) : (
            <LocalizationProvider dateAdapter={AdapterDateFns}>
              <DatePicker
                label="Select Date"
                value={exportSpecificDate}
                onChange={setExportSpecificDate}
              />
            </LocalizationProvider>
          )}

          {exportType === 'income' && (
            <FormControl fullWidth sx={{ mt: 2 }}>
              <InputLabel>Referred By</InputLabel>
              <Select
                value={selectedReferredBy}
                onChange={(e) => setSelectedReferredBy(e.target.value)}
                label="Referred By"
              >
                <MenuItem value="all">All</MenuItem>
                {referredByList.map((referredBy) => (
                  <MenuItem key={referredBy} value={referredBy}>
                    {referredBy}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          )}
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={() => setExportDialogOpen(false)}>Cancel</Button>
        <Button 
          onClick={() => {
            console.log('Generate PDF button clicked');
            generatePDF();
          }} 
          variant="contained" 
          color="primary"
        >
          Generate PDF
        </Button>
      </DialogActions>
    </Dialog>
  );

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeExpensePage = (event, newPage) => {
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
          {/* Left side with back button and title */}
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

          {/* Right side with both buttons */}
          <Box display="flex" gap={2}>
            {user?.isAdmin && (
              <Button
                variant="outlined"
                startIcon={<MonetizationIcon />}
                onClick={() => setIsIqamaPriceDialogOpen(true)}
                sx={{
                  borderRadius: 2,
                  '&:hover': {
                    borderColor: 'primary.dark',
                    bgcolor: 'primary.lighter'
                  }
                }}
              >
                IQAMA Price: SAR {iqamaPrice}
              </Button>
            )}

            <Button
              variant="outlined"
              startIcon={<PeopleIcon />}
              onClick={() => navigate('/users')}
              sx={{
                borderRadius: 2,
                '&:hover': {
                  borderColor: 'primary.dark',
                  bgcolor: 'primary.lighter'
                }
              }}
            >
              Manage Users
            </Button>
          </Box>
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
                  SR {totalIncome}
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
                  SR {totalExpense}
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
                  SR {totalIncome - totalExpense}
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
                  <IconButton 
                    onClick={() => setShowIncomeFilters(!showIncomeFilters)}
                    sx={{ 
                      color: showIncomeFilters ? 'primary.main' : 'text.secondary',
                      bgcolor: showIncomeFilters ? 'primary.lighter' : 'transparent'
                    }}
                  >
                    <FilterIcon />
                  </IconButton>
                  <Tooltip title="Refresh">
                    <IconButton 
                      onClick={fetchData}
                      disabled={loading}
                      sx={{ 
                        bgcolor: 'success.main',
                        color: '#fff',
                        '&:hover': { 
                          bgcolor: 'success.dark', 
                          color: '#fff' 
                        },
                        '&.Mui-disabled': {
                          bgcolor: 'success.main',
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
                    startIcon={<ReceiptIcon />}
                    variant="outlined"
                    size="small"
                    onClick={() => handleExportClick('income')}
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
                <>
                  <FilterSection 
                    type="income" 
                    visible={showIncomeFilters}
                    filters={incomeFilters}
                    onFilterChange={handleFilterChange}
                    referredByList={referredByList}
                  />
                  <TableContainer>
                    <Table size="small" aria-label="income table">
                      <TableHead>
                        <TableRow>
                          <TableCell 
                            onClick={() => handleSort('dateAndTime')}
                            sx={{ 
                              cursor: 'pointer', 
                              '&:hover': { bgcolor: 'action.hover' },
                              width: '10%',
                              whiteSpace: 'pre-line',
                              textAlign: 'left'
                            }}
                          >
                            Date {sortField === 'dateAndTime' && (sortOrder === 'asc' ? '↑' : '↓')}
                          </TableCell>
                          <TableCell 
                            onClick={() => handleSort('name')}
                            sx={{ 
                              cursor: 'pointer', 
                              '&:hover': { bgcolor: 'action.hover' },
                              width: '35%'
                            }}
                          >
                            Name {sortField === 'name' && (sortOrder === 'asc' ? '↑' : '↓')}
                          </TableCell>
                          <TableCell sx={{ width: '25%' }}>
                            Iqama
                          </TableCell>
                          <TableCell 
                            onClick={() => handleSort('amount')}
                            sx={{ 
                              cursor: 'pointer', 
                              '&:hover': { bgcolor: 'action.hover' },
                              width: '25%'
                            }}
                          >
                            Amount {sortField === 'amount' && (sortOrder === 'asc' ? '↑' : '↓')}
                          </TableCell>
                          <TableCell 
                            sx={{ 
                              width: '15%',
                              textAlign: 'center'
                            }}
                          >
                            Actions
                          </TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {sortedIncomes
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
                                    Referred by: {income.referredBy}
                                  </Typography>
                                )}
                              </TableCell>
                              <TableCell>{income.iqamaNumber}</TableCell>
                              <TableCell sx={{ color: 'success.main', fontWeight: 'bold' }}>
                                {income.amount.toFixed(2)}
                              </TableCell>
                              <TableCell sx={{ textAlign: 'center' }}>
                                <IconButton
                                  size="small"
                                  onClick={() => handleEdit(income, 'income')}
                                  sx={{ color: 'primary.main', mr: 1 }}
                                >
                                  <EditIcon fontSize="small" />
                                </IconButton>
                                <IconButton
                                  size="small"
                                  onClick={() => handleDeleteClick(income, 'income')}
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
                    count={sortedIncomes.length}
                    page={page}
                    onPageChange={handleChangePage}
                    rowsPerPage={rowsPerPage}
                    rowsPerPageOptions={[10]}
                    sx={{
                      borderTop: '1px solid',
                      borderColor: 'divider'
                    }}
                  />
                </>
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
                  <IconButton 
                    onClick={() => setShowExpenseFilters(!showExpenseFilters)}
                    sx={{ 
                      color: showExpenseFilters ? 'primary.main' : 'text.secondary',
                      bgcolor: showExpenseFilters ? 'primary.lighter' : 'transparent'
                    }}
                  >
                    <FilterIcon />
                  </IconButton>
                  <Tooltip title="Refresh">
                    <IconButton 
                      onClick={fetchData}
                      disabled={loading}
                      sx={{ 
                        bgcolor: 'error.main',
                        color: '#fff',
                        '&:hover': { 
                          bgcolor: 'error.dark', 
                          color: '#fff' 
                        },
                        '&.Mui-disabled': {
                          bgcolor: 'error.main',
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
                    startIcon={<ReceiptIcon />}
                    variant="outlined"
                    size="small"
                    onClick={() => handleExportClick('expense')}
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
                <>
                  <FilterSection 
                    type="expense" 
                    visible={showExpenseFilters}
                    filters={expenseFilters}
                    onFilterChange={handleFilterChange}
                    referredByList={referredByList}
                  />
                  <TableContainer>
                    <Table size="small" aria-label="expense table">
                      <TableHead>
                        <TableRow>
                          <TableCell 
                            onClick={() => handleExpenseSort('dateAndTime')}
                            sx={{ 
                              cursor: 'pointer', 
                              '&:hover': { bgcolor: 'action.hover' },
                              width: '10%',
                              whiteSpace: 'pre-line',
                              textAlign: 'left'
                            }}
                          >
                            Date {expenseSortField === 'dateAndTime' && (expenseSortOrder === 'asc' ? '↑' : '↓')}
                          </TableCell>
                          <TableCell 
                            onClick={() => handleExpenseSort('company.name')}
                            sx={{ 
                              cursor: 'pointer', 
                              '&:hover': { bgcolor: 'action.hover' },
                              width: '25%'
                            }}
                          >
                            Company {expenseSortField === 'company.name' && (expenseSortOrder === 'asc' ? '↑' : '↓')}
                          </TableCell>
                          <TableCell 
                            onClick={() => handleExpenseSort('expenseType')}
                            sx={{ 
                              cursor: 'pointer', 
                              '&:hover': { bgcolor: 'action.hover' },
                              width: '20%'
                            }}
                          >
                            Paid For {expenseSortField === 'expenseType' && (expenseSortOrder === 'asc' ? '↑' : '↓')}
                          </TableCell>
                          <TableCell 
                            onClick={() => handleExpenseSort('amount')}
                            sx={{ 
                              cursor: 'pointer', 
                              '&:hover': { bgcolor: 'action.hover' },
                              width: '20%'
                            }}
                          >
                            Amount {expenseSortField === 'amount' && (expenseSortOrder === 'asc' ? '↑' : '↓')}
                          </TableCell>
                          <TableCell 
                            sx={{ 
                              width: '15%',
                              textAlign: 'center'
                            }}
                          >
                            Actions
                          </TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {sortedExpenses
                          .slice(expensePage * expenseRowsPerPage, expensePage * expenseRowsPerPage + expenseRowsPerPage)
                          .map((expense) => (
                          <TableRow key={expense._id}>
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
                                {formatDate(expense.createdAt)}
                              </Typography>
                            </TableCell>
                            <TableCell>
                              {expense.company ? (
                                <Tooltip
                                  title={
                                    <Box sx={{ whiteSpace: 'pre-line' }}>
                                      CR: {expense.company?.crNumber || '-'}
                                      {'\n'}
                                      Sponsor ID: {expense.company?.sponserId || '-'}
                                      {'\n'}
                                      GOSI: {expense.company?.gosiNumber || '-'}
                                      {'\n'}
                                      MOL: {expense.company?.molNumber || '-'}
                                    </Box>
                                  }
                                  arrow
                                >
                                  <Typography sx={{ cursor: 'pointer' }}>{expense.company.name}</Typography>
                                </Tooltip>
                              ) : (
                                <Typography>Namora</Typography>
                              )}
                            </TableCell>
                            <TableCell>{expense.specification || (expense.expenseType ? expense.expenseType.replace('_', ' ') : 'Other')}</TableCell>
                            <TableCell sx={{ color: 'error.main' }}>{expense.amount.toFixed(2)}</TableCell>
                            <TableCell>
                              <IconButton
                                size="small"
                                onClick={() => handleEdit(expense, 'expense')}
                                sx={{ color: 'primary.main', mr: 1 }}
                              >
                                <EditIcon fontSize="small" />
                              </IconButton>
                              <IconButton
                                size="small"
                                onClick={() => handleDeleteClick(expense, 'expense')}
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
                    count={sortedExpenses.length}
                    page={expensePage}
                    onPageChange={handleChangeExpensePage}
                    rowsPerPage={expenseRowsPerPage}
                    rowsPerPageOptions={[10]}
                    sx={{
                      borderTop: '1px solid',
                      borderColor: 'divider'
                    }}
                  />
                </>
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
          {editData ? 'Edit' : 'Add New'} {dialogType === 'income' ? 'Income' : 'Expense'}
        </DialogTitle>
        <DialogContent>
          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}
          <Box component="form" onSubmit={handleSubmit} sx={{ mt: 2 }}>
            {dialogType === 'income' ? (
              <>
                <TextField
                  fullWidth
                  label="Name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                  margin="normal"
                />
                <TextField
                  fullWidth
                  label="Iqama Number"
                  value={formData.iqamaNumber}
                  onChange={(e) => setFormData({ ...formData, iqamaNumber: e.target.value })}
                  required
                  margin="normal"
                />
                <TextField
                  fullWidth
                  label="Amount"
                  type="number"
                  value={formData.amount}
                  onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                  required
                  margin="normal"
                />
                <TextField
                  fullWidth
                  label="Referred By"
                  value={formData.referredBy}
                  onChange={(e) => setFormData({ ...formData, referredBy: e.target.value })}
                  margin="normal"
                />
              </>
            ) : (
              <>
                <FormControl fullWidth margin="normal">
                  <InputLabel>Paid For</InputLabel>
                  <Select
                    value={formData.expenseType}
                    onChange={(e) => setFormData({ ...formData, expenseType: e.target.value })}
                    label="Paid For"
                    required
                  >
                    <MenuItem value="cr">CR Amount</MenuItem>
                    <MenuItem value="qiwa">Qiwa Amount</MenuItem>
                    <MenuItem value="muqeem">Muqeem Amount</MenuItem>
                    <MenuItem value="saudi">Saudi Amount</MenuItem>
                    <MenuItem value="efa">EFA Amount</MenuItem>
                    <MenuItem value="other">Other</MenuItem>
                  </Select>
                </FormControl>
                {formData.expenseType === 'other' && (
                  <TextField
                    fullWidth
                    label="Specify Other"
                    value={formData.specification}
                    onChange={(e) => setFormData({ ...formData, specification: e.target.value })}
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
              </>
            )}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Cancel</Button>
          <Button onClick={handleSubmit} variant="contained" color="primary">
            {editData ? 'Update' : 'Add'}
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog
        open={deleteConfirmOpen}
        onClose={() => setDeleteConfirmOpen(false)}
      >
        <DialogTitle>Confirm Delete</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete this {itemToDelete?.type}?
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteConfirmOpen(false)}>Cancel</Button>
          <Button onClick={handleDelete} color="error" variant="contained">
            Delete
          </Button>
        </DialogActions>
      </Dialog>

      {ExportDialog()}

      <IqamaPriceDialog
        open={isIqamaPriceDialogOpen}
        onClose={() => setIsIqamaPriceDialogOpen(false)}
        currentPrice={iqamaPrice}
        onSubmit={handleUpdatePrice}
      />
    </Box>
  );
}

export default IncomeExpense;