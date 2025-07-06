import { useState, useEffect, useMemo, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box,
  Container,
  TextField,
  IconButton,
  Grid,
  Typography,
  InputAdornment,
  CircularProgress,
  Fade,
  Chip,
  useTheme,
  Paper,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Avatar,
  Fab,
  Alert,
  Button,
  Card,
  CardContent,
  Divider,
  Stack,
  Tooltip,
  Skeleton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from '@mui/material';
import {
  Search as SearchIcon,
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Business as BusinessIcon,
  Sort as SortIcon,
  Person as PersonIcon,
  Badge as BadgeIcon,
  CalendarToday as CalendarIcon,
  Autorenew as RenewIcon,
  LocationOn as LocationIcon,
  Phone as PhoneIcon,
  MonetizationOn as MonetizationIcon,
  PictureAsPdf as PdfIcon,
  ContentCopy as ContentCopyIcon,
  Error as ErrorIcon,
  Warning as WarningIcon,
  FilterList as FilterListIcon,
  Description as DescriptionIcon,
} from '@mui/icons-material';
import { individualApi, companyApi, incomeApi, notifyAdminApi } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { format } from 'date-fns';
import LoadingScreen from '../components/common/LoadingScreen';
import IndividualDialog from '../components/dialogs/IndividualDialog';
import ConfirmDialog from '../components/dialogs/ConfirmDialog';
import ProfileMenu from '../components/ProfileMenu';
import LanguageSwitcher from '../components/common/LanguageSwitcher';
import { IndividualCardSkeletonList } from '../components/skeletons/IndividualCardSkeleton';
import PaymentDialog from '../components/dialogs/PaymentDialog';
import { toast } from 'react-hot-toast';
import { useTranslation } from 'react-i18next';
import printIdPdf from '../utils/pdf/PrintIdPdf';

const calculateStatus = (expiryDate) => {
  const daysUntilExpiry = Math.ceil((new Date(expiryDate) - new Date()) / (1000 * 60 * 60 * 24));
  
  if (daysUntilExpiry <= 0) {
    return 'Expired';
  } else if (daysUntilExpiry <= 20) {
    return 'Warning';
  } else {
    return 'Active';
  }
};

const getDaysUntilExpiry = (expiryDate) => {
  return Math.ceil((new Date(expiryDate) - new Date()) / (1000 * 60 * 60 * 24));
};

const formatText = (text) => {
  if (!text) return '';
  return text.charAt(0).toUpperCase() + text.slice(1).toLowerCase();
};

function IndividualList() {
  const { id: companyId } = useParams();
  const [allIndividuals, setAllIndividuals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [company, setCompany] = useState(null);
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('all');
  const [sort, setSort] = useState('name');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedIndividual, setSelectedIndividual] = useState(null);
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);
  const [individualToDelete, setIndividualToDelete] = useState(null);
  const [dialogMode, setDialogMode] = useState('add');
  const [confirmMessage, setConfirmMessage] = useState('');
  const [confirmAction, setConfirmAction] = useState(null);
  const [dialogError, setDialogError] = useState('');
  const theme = useTheme();
  const [paymentDialogOpen, setPaymentDialogOpen] = useState(false);
  const [paymentAmount, setPaymentAmount] = useState('');
  const [paymentError, setPaymentError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [copyFeedback, setCopyFeedback] = useState({
    open: false,
    text: ''
  });
  const [referredByList, setReferredByList] = useState([]);
  const { t } = useTranslation();
  const [formData, setFormData] = useState({
    name: '',
    nationality: '',
    phoneNumber: '',
    iqamaNumber: '',
    description: '',
    expiryDate: null,
    company: '',
    mainPerson: '',
    referredBy: '',
    amount: '',
    iqamaPrice: 5000
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [companyResponse, individualsResponse] = await Promise.all([
          companyApi.getById(companyId),
          individualApi.getByCompany(companyId)
        ]);
        
        setCompany(companyResponse.data);
        setAllIndividuals(individualsResponse.data);
        setLoading(false);
      } catch (error) {
        console.error('Error fetching data:', error);
        setError('Failed to load data');
        setLoading(false);
      }
    };

    fetchData();
  }, [companyId]);

  const filteredData = useMemo(() => {
    return allIndividuals.filter(individual => {
      const searchTermLower = search.toLowerCase().trim();
      
      // If no search term, return all individuals
      if (!searchTermLower) return true;

      // Check all searchable fields
      return (
        individual.name?.toLowerCase().includes(searchTermLower) ||
        individual.iqamaNumber?.toLowerCase().includes(searchTermLower) ||
        individual.passportNumber?.toLowerCase().includes(searchTermLower) ||
        individual.nationality?.toLowerCase().includes(searchTermLower) ||
        individual.profession?.toLowerCase().includes(searchTermLower)
      );
    }).filter(individual => {
      const daysUntilExpiry = Math.ceil((new Date(individual.expiryDate) - new Date()) / (1000 * 60 * 60 * 24));
      
      // Filter by status
      switch (filter) {
        case 'expired':
          return daysUntilExpiry <= 0;
        case 'warning':
          return daysUntilExpiry > 0 && daysUntilExpiry <= 20;
        case 'active':
          return daysUntilExpiry > 20;
        default: // 'all'
          return true;
      }
    });
  }, [allIndividuals, search, filter]);

  const sortedData = useMemo(() => {
    return [...filteredData].sort((a, b) => {
      const daysUntilExpiryA = Math.ceil((new Date(a.expiryDate) - new Date()) / (1000 * 60 * 60 * 24));
      const daysUntilExpiryB = Math.ceil((new Date(b.expiryDate) - new Date()) / (1000 * 60 * 60 * 24));

      switch (sort) {
        case 'name':
          return (a.name || '').localeCompare(b.name || '');
        case 'expiryDate':
          return daysUntilExpiryA - daysUntilExpiryB;
        case 'nationality':
          return (a.nationality || '').localeCompare(b.nationality || '');
        default:
          return 0;
      }
    });
  }, [filteredData, sort]);

  const handleAdd = () => {
    setSelectedIndividual(null);
    setDialogMode('add');
    setDialogOpen(true);
  };

  const handleEdit = (individual) => {
    setSelectedIndividual(individual);
    setDialogMode('edit');
    if (referredByList.length === 0) {
      fetchReferredByList();
    }
    if (individual.referredBy && !referredByList.includes(individual.referredBy)) {
      setReferredByList(prev => [...new Set([...prev, individual.referredBy])]);
    }
    setDialogOpen(true);
  };

  const handleRenew = (individual) => {
    if (!individual.isFullyPaid) {
      setError('Please complete all payments before renewing');
      return;
    }
    setSelectedIndividual({
      ...individual,
      pendingAmount: individual.iqamaPrice, // Reset pending amount to full iqama price
      totalPaidAmount: 0 // Reset total paid amount
    });
    setDialogMode('renew');
    setDialogOpen(true);
  };

  const handleDelete = (individual) => {
    setIndividualToDelete(individual);
    setConfirmMessage(t('dialogs.confirm.deleteIndividual', { name: individual.name }));
    setConfirmAction(() => () => handleConfirmDelete(individual));
    setConfirmDialogOpen(true);
  };

  const handleConfirmDelete = async (individual) => {
    try {
      await individualApi.delete(individual._id);
      const response = await individualApi.getByCompany(companyId);
      setAllIndividuals(response.data);
      setConfirmDialogOpen(false);
      toast.success(t('toast.individualDeleted'));
    } catch (error) {
      console.error('Error deleting individual:', error);
      setError(t('toast.individualDeleteError'));
    }
  };

  const fetchReferredByList = async () => {
    try {
      const response = await incomeApi.getReferredByList();
      const uniqueOptions = [...new Set(response.data.filter(option => option))];
      setReferredByList(uniqueOptions);
    } catch (error) {
      console.error('Error fetching referred by list:', error);
    }
  };

  const handleSubmit = async (formData) => {
    try {
      setDialogError('');
      let message;
      
      if (!user.isAdmin) {
        // Get company to set mainPerson
        const company = await companyApi.getById(companyId);
        
        // For regular users, create a notification
        const notificationData = {
          name: selectedIndividual?.name || formData.name,
          nationality: selectedIndividual?.nationality || formData.nationality,
          phoneNumber: selectedIndividual?.phoneNumber || formData.phoneNumber,
          iqamaNumber: selectedIndividual?.iqamaNumber || formData.iqamaNumber,
          expiryDate: formData.expiryDate,
          company: companyId,
          mainPerson: company.data.mainPerson, // Add mainPerson from company
          requestType: dialogMode === 'add' ? 'ADD' : 'RENEW',
          originalIndividual: selectedIndividual?._id,
          amount: Number(formData.amount) || 0,
          iqamaPrice: formData.customIqamaPrice ? Number(formData.customIqamaPrice) : (selectedIndividual?.iqamaPrice || 5000),
          priceOverridden: Boolean(formData.customIqamaPrice),
          customPriceReason: formData.customPriceReason || '',
          totalPaidAmount: selectedIndividual?.totalPaidAmount || 0,
          referredBy: user.username
        };
        
        await notifyAdminApi.create(notificationData);
        toast.success(t('toast.individualRequestSent'));
        setDialogOpen(false);
        return;
      }

      // For admin users, process directly
      if (dialogMode === 'add') {
        message = t('dialogs.confirm.addIndividual');
      } else if (dialogMode === 'edit') {
        message = t('dialogs.confirm.editIndividual', { name: selectedIndividual.name });
      } else {
        message = t('dialogs.confirm.renewIndividual', { name: selectedIndividual.name });
      }
      
      setConfirmMessage(message);
      setConfirmAction(() => async () => {
        try {
          let response;
          if (dialogMode === 'add') {
            response = await individualApi.create({ ...formData, company: companyId });
          } else if (dialogMode === 'edit') {
            response = await individualApi.update(selectedIndividual._id, formData);
          } else {
            // For renewal, send only the necessary fields including custom pricing
            const renewalData = {
              expiryDate: formData.expiryDate,
              amount: Number(formData.amount) || 0,
              isRenewal: true // Add this flag to indicate it's a renewal operation
            };

            // Add custom pricing if provided
            if (formData.customIqamaPrice) {
              renewalData.customIqamaPrice = Number(formData.customIqamaPrice);
              renewalData.customPriceReason = formData.customPriceReason || '';
            }

            response = await individualApi.update(selectedIndividual._id, renewalData);
          }
          
          const updatedList = await individualApi.getByCompany(companyId);
          setAllIndividuals(updatedList.data);
          setDialogOpen(false);
          setConfirmDialogOpen(false);
          toast.success(t(`toast.individual${dialogMode === 'add' ? 'Added' : dialogMode === 'edit' ? 'Updated' : 'Renewed'}`));
        } catch (error) {
          console.error('Error:', error);
          setDialogError(error.response?.data?.message || t('toast.individualSaveError'));
        }
      });
      setConfirmDialogOpen(true);
    } catch (error) {
      console.error('Error in handleSubmit:', error);
      setDialogError(error.message || t('toast.unexpectedError'));
    }
  };

  // Modified keyPress handler for confirmation dialog to work with all modes
  const handleConfirmKeyPress = useCallback((e) => {
    if (e.key === 'Enter' && confirmDialogOpen && confirmAction) {
      e.preventDefault();
      e.stopPropagation();
      confirmAction();
    }
  }, [confirmDialogOpen, confirmAction]);

  useEffect(() => {
    if (confirmDialogOpen) {
      const timer = setTimeout(() => {
        window.addEventListener('keypress', handleConfirmKeyPress);
      }, 300);
      
      return () => {
        clearTimeout(timer);
        window.removeEventListener('keypress', handleConfirmKeyPress);
      };
    }
  }, [confirmDialogOpen, handleConfirmKeyPress]);

  useEffect(() => {
    fetchReferredByList();
  }, []);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'Active':
        return 'success.main';
      case 'Expired':
        return 'error.main';
      case 'Critical':
      case 'Warning':
        return 'warning.main';
      default:
        return 'grey.400';
    }
  };

  const handlePayPending = (individual) => {
    setSelectedIndividual(individual);
    setPaymentAmount('');
    setPaymentDialogOpen(true);
  };

  const handlePaymentSubmit = async (amount) => {
    try {
      if (!user.isAdmin) {
        // Get company to set mainPerson
        const company = await companyApi.getById(companyId);
        
        // For regular users, create a payment notification
        const notificationData = {
          name: selectedIndividual.name,
          nationality: selectedIndividual.nationality,
          phoneNumber: selectedIndividual.phoneNumber,
          iqamaNumber: selectedIndividual.iqamaNumber,
          expiryDate: selectedIndividual.expiryDate,
          company: companyId,
          mainPerson: company.data.mainPerson, // Add mainPerson from company
          amount: amount,
          requestType: 'PAYMENT',
          originalIndividual: selectedIndividual._id,
          referredBy: selectedIndividual.referredBy || user.username // Add referredBy
        };
        
        await notifyAdminApi.create(notificationData);
        toast.success(t('toast.paymentRequestSent'));
        setPaymentDialogOpen(false);
        return;
      }

      // For admin users, process payment directly
      const response = await individualApi.payPending(selectedIndividual._id, {
        amount: amount
      });
      
      // Refresh the list
      const updatedList = await individualApi.getByCompany(companyId);
      setAllIndividuals(updatedList.data);
      
      setPaymentDialogOpen(false);
      toast.success(t('toast.paymentProcessed'));
    } catch (error) {
      throw new Error(t('toast.paymentError'));
    }
  };

  const handleCopy = (text, label) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopyFeedback({
        open: true,
        text: `${label} copied!`
      });
      
      // Auto hide after 2 seconds
      setTimeout(() => {
        setCopyFeedback({ open: false, text: '' });
      }, 2000);
    });
  };

  // Handle print PDF functionality
  const handlePrintPdf = () => {
    try {
      if (!company) {
        toast.error(t('toast.noCompanyData'));
        return;
      }
      
      // Use our custom PDF generator instead of window.print()
      const success = printIdPdf(company, sortedData, {
        filename: `${company.name}-individuals-report.pdf`
      });
      
      if (success) {
        toast.success(t('toast.pdfGenerated'));
      } else {
        toast.error(t('toast.pdfGenerationFailed'));
      }
    } catch (error) {
      console.error('Error generating PDF:', error);
      toast.error(t('toast.pdfGenerationError'));
    }
  };

  if (error) return <Alert severity="error">{error}</Alert>;

  return (
    <Box sx={{ width: '100%', minHeight: '100vh', bgcolor: 'background.default', pt: 4, pb: 6 }}>
      <Container maxWidth="lg">
        <Fade in timeout={800}>
          <Paper 
            elevation={0}
            sx={{ 
              p: 3,
              borderRadius: '24px 24px 0 0',
              bgcolor: 'primary.light',
              color: 'primary.dark'
            }}
          >
            <Box sx={{ 
              display: 'flex', 
              justifyContent: 'space-between',
              alignItems: 'flex-start',
              flexDirection: { xs: 'column', sm: 'row' },
              gap: 2
            }}>
              <Box 
                sx={{ 
                  display: 'flex', 
                  width: '100%',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}
              >
                <Box display="flex" alignItems="center" gap={2}>
                  <Avatar sx={{ bgcolor: 'primary.main', width: 48, height: 48 }}>
                    <BusinessIcon />
                  </Avatar>
                  <Box>
                    <Typography variant="h6" fontWeight="bold">
                      {company?.name || <Skeleton width={200} />}
                    </Typography>
                    <Typography variant="body2">
                      {loading ? <Skeleton width={150} /> : `${t('common.managing')} ${filteredData.length} ${t('navigation.individuals')}`}
                    </Typography>
                  </Box>
                </Box>

                <Stack 
                  direction="row" 
                  spacing={1}
                  alignItems="center"
                  sx={{ 
                    display: { xs: 'flex', sm: 'none' }
                  }}
                >
                  <Tooltip title={t('common.print')}>
                    <IconButton
                      onClick={handlePrintPdf}
                      size="small"
                      sx={{ 
                        bgcolor: 'secondary.main',
                        color: 'white',
                        '&:hover': {
                          bgcolor: 'secondary.dark',
                        }
                      }}
                    >
                      <Avatar 
                        sx={{ 
                          width: 32, 
                          height: 32,
                          bgcolor: 'inherit',
                          color: 'inherit'
                        }}
                      >
                        <PdfIcon />
                      </Avatar>
                    </IconButton>
                  </Tooltip>

                  <LanguageSwitcher />

                  <ProfileMenu 
                    username={user?.username} 
                    onLogout={handleLogout}
                  />
                </Stack>
              </Box>

              <Stack 
                direction={{ xs: 'row', sm: 'row' }} 
                spacing={2} 
                alignItems="center"
                sx={{
                  width: { xs: '100%', sm: 'auto' },
                  justifyContent: { xs: 'space-between', sm: 'flex-end' },
                  mt: { xs: 2, sm: 0 },
                  display: { xs: 'flex', sm: 'flex' }
                }}
              >
                <Paper
                  elevation={0}
                  sx={{ 
                    px: 2,
                    py: 1,
                    bgcolor: 'transparent',
                    borderRadius: 2,
                    display: 'flex',
                    flexDirection: 'column',
                    gap: { xs: 1, sm: 2 },
                    width: '100%'
                  }}
                >
                  {/* First row: CR and GOSI */}
                  <Box sx={{ 
                    display: 'flex', 
                    flexDirection: { xs: 'column', sm: 'row' },
                    gap: { xs: 1, sm: 4 },
                    width: '100%',
                    alignItems: { xs: 'flex-start', sm: 'center' }
                  }}>
                    <Typography 
                      variant="body2" 
                      color="primary.dark" 
                      sx={{ 
                        display: 'flex', 
                        alignItems: 'center', 
                        gap: 1,
                        whiteSpace: 'nowrap',
                        minWidth: { sm: '200px' }
                      }}
                    >
                      <BusinessIcon sx={{ fontSize: 16 }} />
                      {t('company.cr')}: {company?.crNumber || t('common.na')}
                      {company?.crNumber && (
                        <Tooltip 
                          open={copyFeedback.open && copyFeedback.text === 'CR Number copied!'}
                          title={t('common.copied')}
                          placement="top"
                        >
                          <IconButton
                            size="small"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleCopy(company.crNumber, 'CR Number');
                            }}
                            sx={{ p: 0.5 }}
                          >
                            <ContentCopyIcon sx={{ fontSize: 14 }} />
                          </IconButton>
                        </Tooltip>
                      )}
                    </Typography>

                    <Typography 
                      variant="body2" 
                      color="primary.dark" 
                      sx={{ 
                        display: 'flex', 
                        alignItems: 'center', 
                        gap: 1,
                        whiteSpace: 'nowrap',
                        minWidth: { sm: '200px' }
                      }}
                    >
                      <BadgeIcon sx={{ fontSize: 16 }} />
                      {t('company.gosi')}: {company?.gosiNumber || t('common.na')}
                      {company?.gosiNumber && (
                        <Tooltip 
                          open={copyFeedback.open && copyFeedback.text === 'GOSI Number copied!'}
                          title={t('common.copied')}
                          placement="top"
                        >
                          <IconButton
                            size="small"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleCopy(company.gosiNumber, 'GOSI Number');
                            }}
                            sx={{ p: 0.5 }}
                          >
                            <ContentCopyIcon sx={{ fontSize: 14 }} />
                          </IconButton>
                        </Tooltip>
                      )}
                    </Typography>
                  </Box>

                  {/* Second row: Sponsor and MOI */}
                  <Box sx={{ 
                    display: 'flex', 
                    flexDirection: { xs: 'column', sm: 'row' },
                    gap: { xs: 1, sm: 4 },
                    width: '100%',
                    alignItems: { xs: 'flex-start', sm: 'center' }
                  }}>
                    <Typography 
                      variant="body2" 
                      color="primary.dark" 
                      sx={{ 
                        display: 'flex', 
                        alignItems: 'center', 
                        gap: 1,
                        whiteSpace: 'nowrap',
                        minWidth: { sm: '200px' }
                      }}
                    >
                      <PersonIcon sx={{ fontSize: 16 }} />
                      {t('company.sponsor')}: {company?.sponserId || t('common.na')}
                      {company?.sponserId && (
                        <Tooltip 
                          open={copyFeedback.open && copyFeedback.text === 'Sponsor copied!'}
                          title={t('common.copied')}
                          placement="top"
                        >
                          <IconButton
                            size="small"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleCopy(company.sponserId, 'Sponsor');
                            }}
                            sx={{ p: 0.5 }}
                          >
                            <ContentCopyIcon sx={{ fontSize: 14 }} />
                          </IconButton>
                        </Tooltip>
                      )}
                    </Typography>

                    <Typography 
                      variant="body2" 
                      color="primary.dark" 
                      sx={{ 
                        display: 'flex', 
                        alignItems: 'center', 
                        gap: 1,
                        whiteSpace: 'nowrap',
                        minWidth: { sm: '200px' }
                      }}
                    >
                      <LocationIcon sx={{ fontSize: 16 }} />
                      {t('company.mol')}: {company?.makthabNumber || company?.molNumber || t('common.na')}
                      {(company?.makthabNumber || company?.molNumber) && (
                        <Tooltip 
                          open={copyFeedback.open && copyFeedback.text === 'MOL copied!'}
                          title={t('common.copied')}
                          placement="top"
                        >
                          <IconButton
                            size="small"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleCopy(company?.makthabNumber || company?.molNumber, 'MOI');
                            }}
                            sx={{ p: 0.5 }}
                          >
                            <ContentCopyIcon sx={{ fontSize: 14 }} />
                          </IconButton>
                        </Tooltip>
                      )}
                    </Typography>
                  </Box>
                </Paper>
                
                <Stack 
                  direction="row" 
                  spacing={2}
                  alignItems="center"
                  sx={{ 
                    display: { xs: 'none', sm: 'flex' }
                  }}
                >
                  <Tooltip title={t('common.print')}>
                    <IconButton
                      onClick={handlePrintPdf}
                      size="small"
                      sx={{ 
                        bgcolor: 'secondary.main',
                        color: 'white',
                        '&:hover': {
                          bgcolor: 'secondary.dark',
                        }
                      }}
                    >
                      <Avatar 
                        sx={{ 
                          width: 32, 
                          height: 32,
                          bgcolor: 'inherit',
                          color: 'inherit'
                        }}
                      >
                        <PdfIcon />
                      </Avatar>
                    </IconButton>
                  </Tooltip>

                  <LanguageSwitcher />

                  <ProfileMenu 
                    username={user?.username} 
                    onLogout={handleLogout}
                  />
                </Stack>
              </Stack>
            </Box>
          </Paper>
        </Fade>

        <Box 
          sx={{ 
            display: 'flex', 
            gap: 2, 
            mb: 4, 
            flexDirection: { xs: 'column', sm: 'row' },
            backgroundColor: 'white',
            p: 2,
            borderRadius: '0 0 8px 8px',
            boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
            '@media print': {
              display: 'none'
            }
          }}
        >
          <TextField
            fullWidth
            placeholder={t('individual.search')}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon color="action" />
                </InputAdornment>
              ),
            }}
            sx={{ 
              flex: 1,
              '& .MuiOutlinedInput-root': {
                backgroundColor: 'background.paper'
              }
            }}
          />
          
          <FormControl>
            <InputLabel>{t('common.filter')}</InputLabel>
            <Select
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              label={t('common.filter')}
              startAdornment={<FilterListIcon color="action" sx={{ mr: 1 }} />}
            >
              <MenuItem value="all">{t('individual.filterAll')}</MenuItem>
              <MenuItem value="expired">{t('individual.filterExpired')}</MenuItem>
              <MenuItem value="warning">{t('individual.filterWarning')}</MenuItem>
              <MenuItem value="active">{t('individual.filterActive')}</MenuItem>
            </Select>
          </FormControl>

          <FormControl>
            <InputLabel>{t('common.sortBy')}</InputLabel>
            <Select
              value={sort}
              onChange={(e) => setSort(e.target.value)}
              label={t('common.sortBy')}
              startAdornment={<SortIcon color="action" sx={{ mr: 1 }} />}
            >
              <MenuItem value="name">{t('individual.sortName')}</MenuItem>
              <MenuItem value="expiryDate">{t('individual.sortExpiry')}</MenuItem>
              <MenuItem value="nationality">{t('individual.sortNationality')}</MenuItem>
            </Select>
          </FormControl>
        </Box>

        <Fade in timeout={1000}>
          <Box>
            {loading ? (
              <IndividualCardSkeletonList count={8} />
            ) : (
              <Grid container spacing={3}>
                {sortedData.length > 0 ? (
                  sortedData.map((individual) => {
                    const status = calculateStatus(individual.expiryDate);
                    return (
                      <Grid item xs={12} sm={6} md={3} key={individual._id}>
                        <Card
                          sx={{
                            height: '100%',
                            borderRadius: 3,
                            transition: 'all 0.3s ease',
                            position: 'relative',
                            '@media (hover: hover)': {
                              '&:hover': {
                                transform: 'translateY(-4px)',
                                boxShadow: theme.shadows[8]
                              }
                            }
                          }}
                        >
                          <Box sx={{ height: 6, bgcolor: getStatusColor(status), width: '100%' }} />
                          <CardContent sx={{ p: 3 }}>
                            <Box display="flex" alignItems="center" gap={2} mb={2}>
                              <Avatar 
                                sx={{ 
                                  width: 48, 
                                  height: 48,
                                  bgcolor: 'primary.light',
                                  color: 'primary.main'
                                }}
                              >
                                {individual.name?.charAt(0)}
                              </Avatar>
                              <Box flex={1}>
                                <Typography variant="h6" fontWeight="bold" sx={{ fontSize: '1rem' }}>
                                  {formatText(individual.name)}
                                </Typography>
                                <Typography variant="body2" color="text.secondary">
                                  {formatText(individual.nationality)}
                                </Typography>
                              </Box>
                            </Box>

                            <Divider sx={{ my: 2 }} />

                            <Grid container spacing={0}>
                              <Grid item xs={12}>
                                <Box display="flex" alignItems="center" gap={1}>
                                  <BadgeIcon sx={{ fontSize: 16, color: 'primary.main' }} />
                                  <Typography variant="body2" color="text.secondary">
                                    {t('individual.iqamaNumber')}: {individual.iqamaNumber || t('common.na')}
                                  </Typography>
                                </Box>
                              </Grid>
                              
                              <Grid item xs={12}>
                                <Box display="flex" alignItems="center" gap={1}>
                                  <CalendarIcon sx={{ fontSize: 16, color: 'primary.main' }} />
                                  <Typography variant="body2" color="text.secondary">
                                    {t('individual.expiryDate')}: {individual.expiryDate ? 
                                      format(new Date(individual.expiryDate), 'dd MMM yyyy') : 
                                      t('common.na')}
                                  </Typography>
                                </Box>
                              </Grid>

                              <Grid item xs={12}>
                                <Box display="flex" alignItems="center" gap={1}>
                                  <PhoneIcon sx={{ fontSize: 16, color: 'primary.main' }} />
                                  <Typography variant="body2" color="text.secondary">
                                    {t('individual.phoneNumber')}: <span className={individual.phoneNumber ? '' : 'no-link'}>{individual.phoneNumber || t('common.na')}</span>
                                  </Typography>
                                </Box>
                              </Grid>

                              <Grid item xs={12}>
                                <Box display="flex" alignItems="center" gap={1}>
                                  <PersonIcon sx={{ fontSize: 16, color: 'primary.main' }} />
                                  <Typography variant="body2" color="text.secondary">
                                    {t('individual.referredBy')}: {individual.referredBy || t('common.na')}
                                  </Typography>
                                </Box>
                              </Grid>

                              {individual.description && (
                                <Grid item xs={12}>
                                  <Box display="flex" alignItems="flex-start" gap={1} mt={1}>
                                    <DescriptionIcon sx={{ fontSize: 16, color: 'primary.main', mt: 0.5 }} />
                                    <Typography variant="body2" color="text.secondary" sx={{ wordBreak: 'break-word' }}>
                                      {t('individual.description')}: {individual.description}
                                    </Typography>
                                  </Box>
                                </Grid>
                              )}

                              <Grid item xs={12}>
                                <Box display="flex" alignItems="center" gap={1}>
                                  <MonetizationIcon fontSize="small" color="action" />
                                  <Typography variant="body2" color="text.secondary">
                                    {individual.isFullyPaid ? (
                                      t('company.fullyPaid')
                                    ) : (
                                      `${t('individual.pending')}: ${individual.pendingAmount} SAR`
                                    )}
                                  </Typography>
                                </Box>
                              </Grid>

                              <Grid item xs={12}>
                                <Box 
                                  display="flex" 
                                  justifyContent="flex-end" 
                                  alignItems="center"
                                  mt={0}
                                >
                                  <Chip
                                    label={
                                      getDaysUntilExpiry(individual.expiryDate) <= 0 
                                        ? `${t('individual.expired')} ${Math.abs(getDaysUntilExpiry(individual.expiryDate))} ${t('individual.daysAgo')}`
                                        : `${getDaysUntilExpiry(individual.expiryDate)} ${t('individual.daysUntilExpiry')}`
                                    }
                                    size="small"
                                    sx={{
                                      '& .MuiChip-root': {
                                        bgcolor: status === 'Active' ? 'success.main' : 
                                                status === 'Warning' ? 'warning.main' : 
                                                'error.main',
                                      },
                                      bgcolor: status === 'Active' ? 'success.main' : 
                                              status === 'Warning' ? 'warning.main' : 
                                              'error.main',
                                      color: '#fff',
                                      fontWeight: 'medium',
                                      '& .MuiChip-label': {
                                        px: 1
                                      }
                                    }}
                                  />
                                </Box>
                              </Grid>

                              <Grid item xs={12}>
                                <Box 
                                  sx={{ 
                                    mt: 2,
                                    display: 'flex',
                                    gap: 0.75,
                                    '& .MuiButton-root': {
                                      flex: 1,
                                      minWidth: 'auto',
                                      textTransform: 'none',
                                      fontSize: '0.7rem',
                                      py: 0.5,
                                      px: 1,
                                      '& .MuiButton-startIcon': {
                                        marginRight: 0.5,
                                        '& .MuiSvgIcon-root': {
                                          fontSize: 16
                                        }
                                      }
                                    }
                                  }}
                                >
                                  {!individual.isFullyPaid && (
                                    <Tooltip title={t('common.paypendingamount')}>
                                      <Button
                                        size="small"
                                        color="warning"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          handlePayPending(individual);
                                        }}
                                        startIcon={<MonetizationIcon />}
                                        sx={{ 
                                          bgcolor: 'background.paper',
                                          boxShadow: 1,
                                          '&:hover': {
                                            transform: 'translateY(-1px)',
                                            bgcolor: 'warning.lighter'
                                          }
                                        }}
                                      >
                                        {t('common.pay')}
                                      </Button>
                                    </Tooltip>
                                  )}

                                  {individual.isFullyPaid && (
                                    <Tooltip title={t('common.renewiqamatooltip')}>
                                      <Button
                                        size="small"
                                        color="success"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          handleRenew(individual);
                                        }}
                                        startIcon={<RenewIcon />}
                                        sx={{ 
                                          bgcolor: 'background.paper',
                                          boxShadow: 1,
                                          '&:hover': {
                                            transform: 'translateY(-1px)',
                                            bgcolor: 'success.lighter'
                                          }
                                        }}
                                      >
                                        {t('common.renew')}
                                      </Button>
                                    </Tooltip>
                                  )}

                                  {user?.isAdmin && (
                                    <>
                                      <Tooltip title={t('common.editiqamatooltip')}>
                                        <Button
                                          size="small"
                                          color="info"
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            handleEdit(individual);
                                          }}
                                          startIcon={<EditIcon />}
                                          sx={{ 
                                            bgcolor: 'background.paper',
                                            boxShadow: 1,
                                            '&:hover': {
                                              transform: 'translateY(-1px)',
                                              bgcolor: 'info.lighter'
                                            }
                                          }}
                                        >
                                          {t('common.edit')}
                                        </Button>
                                      </Tooltip>

                                      <Tooltip title={t('common.deleteiqamatootip')}>
                                        <Button
                                          size="small"
                                          color="error"
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            handleDelete(individual);
                                          }}
                                          startIcon={<DeleteIcon />}
                                          sx={{ 
                                            bgcolor: 'background.paper',
                                            boxShadow: 1,
                                            '&:hover': {
                                              transform: 'translateY(-1px)',
                                              bgcolor: 'error.lighter'
                                            }
                                          }}
                                        >
                                          {t('common.delete')}
                                        </Button>
                                      </Tooltip>
                                    </>
                                  )}
                                </Box>
                              </Grid>
                            </Grid>
                          </CardContent>
                        </Card>
                      </Grid>
                    );
                  })
                ) : (
                  <Grid item xs={12}>
                    <Paper 
                      sx={{ 
                        p: 4, 
                        textAlign: 'center',
                        borderRadius: 2,
                        bgcolor: 'background.paper'
                      }}
                    >
                      <Box display="flex" flexDirection="column" alignItems="center" gap={2}>
                        <PersonIcon sx={{ fontSize: 64, color: 'text.disabled' }} />
                        <Typography color="textSecondary" variant="h6">
                          No individuals found
                        </Typography>
                        <Typography color="textSecondary" variant="body2">
                          Try adjusting your search or filters
                        </Typography>
                      </Box>
                    </Paper>
                  </Grid>
                )}
              </Grid>
            )}
          </Box>
        </Fade>

        <Fab
          color="primary"
          sx={{
            position: 'fixed',
            bottom: 24,
            right: 24,
            '@media print': {
              display: 'none'
            }
          }}
          onClick={handleAdd}
        >
          <AddIcon />
        </Fab>
      </Container>

      <IndividualDialog
        open={dialogOpen}
        onClose={() => {
          setDialogOpen(false);
          setDialogError('');
        }}
        individual={selectedIndividual}
        onSubmit={handleSubmit}
        mode={dialogMode}
        error={dialogError}
        referredByOptions={referredByList}
      />

      <ConfirmDialog
        open={confirmDialogOpen}
        onClose={() => setConfirmDialogOpen(false)}
        onConfirm={confirmAction}
        title={t('dialogs.confirm.title')}
        message={confirmMessage}
      />

      <PaymentDialog
        open={paymentDialogOpen && selectedIndividual !== null}
        onClose={() => {
          setPaymentDialogOpen(false);
          setSelectedIndividual(null);
        }}
        individual={selectedIndividual}
        onSubmit={handlePaymentSubmit}
        error={error}
      />

      {error && (
        <Alert 
          severity="error" 
          onClose={() => setError(null)}
          sx={{ 
            position: 'fixed', 
            top: 16, 
            right: 16, 
            zIndex: 2000 
          }}
        >
          {error}
        </Alert>
      )}
    </Box>
  );
}

export default IndividualList;