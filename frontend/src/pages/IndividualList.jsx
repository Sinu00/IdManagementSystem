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
} from '@mui/icons-material';
import { individualApi, companyApi, incomeApi } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { format } from 'date-fns';
import LoadingScreen from '../components/common/LoadingScreen';
import IndividualDialog from '../components/dialogs/IndividualDialog';
import ConfirmDialog from '../components/dialogs/ConfirmDialog';
import ProfileMenu from '../components/ProfileMenu';
import { IndividualCardSkeletonList } from '../components/skeletons/IndividualCardSkeleton';
import PaymentDialog from '../components/dialogs/PaymentDialog';

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
    setSelectedIndividual(individual);
    setDialogMode('renew');
    setDialogOpen(true);
  };

  const handleDelete = (individual) => {
    setIndividualToDelete(individual);
    setConfirmMessage(`Are you sure you want to delete ${individual.name}?`);
    setConfirmAction(() => () => handleConfirmDelete(individual));
    setConfirmDialogOpen(true);
  };

  const handleConfirmDelete = async (individual) => {
    try {
      await individualApi.delete(individual._id);
      const response = await individualApi.getByCompany(companyId);
      setAllIndividuals(response.data);
      setConfirmDialogOpen(false);
    } catch (error) {
      console.error('Error deleting individual:', error);
      setError('Failed to delete individual');
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
      if (dialogMode === 'add') {
        message = 'Are you sure you want to add this individual?';
      } else if (dialogMode === 'edit') {
        message = `Are you sure you want to update ${selectedIndividual.name}'s information?`;
      } else {
        message = `Are you sure you want to renew ${selectedIndividual.name}'s ID?`;
      }
      
      setConfirmMessage(message);
      setConfirmAction(() => async () => {
        try {
          if (dialogMode === 'add') {
            await individualApi.create({ 
              ...formData, 
              company: companyId,
              amount: parseFloat(formData.amount) || 0,
              referredBy: formData.referredBy || ''
            });
            if (formData.referredBy) {
              setReferredByList(prev => [...new Set([...prev, formData.referredBy])]);
            }
          } else if (dialogMode === 'edit') {
            await individualApi.update(selectedIndividual._id, formData);
            if (formData.referredBy) {
              setReferredByList(prev => [...new Set([...prev, formData.referredBy])]);
            }
          } else {
            // First update the individual
            const updatedIndividual = await individualApi.update(selectedIndividual._id, { 
              expiryDate: formData.expiryDate,
              amount: parseFloat(formData.amount) || 0
            });

            // Then create the income record using the updated individual data
            if (updatedIndividual.data) {
              await incomeApi.create({
                name: updatedIndividual.data.name,
                amount: parseFloat(formData.amount) || 0,
                iqamaNumber: updatedIndividual.data.iqamaNumber,
                referredBy: updatedIndividual.data.referredBy || '',
                mainPerson: updatedIndividual.data.company.mainPerson._id
              });
            }
          }
          
          const response = await individualApi.getByCompany(companyId);
          setAllIndividuals(response.data);
          setDialogOpen(false);
          setConfirmDialogOpen(false);
          setDialogError('');
        } catch (error) {
          console.error('Error saving individual:', error);
          setDialogError(error.response?.data?.message || 'Failed to save individual');
          setConfirmDialogOpen(false);
        }
      });
      
      window.removeEventListener('keypress', handleConfirmKeyPress);
      setConfirmDialogOpen(true);
    } catch (error) {
      console.error('Error in handleSubmit:', error);
      setDialogError(error.response?.data?.message || 'An error occurred');
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
      const response = await individualApi.payPending(selectedIndividual._id, {
        amount: amount
      });
      
      // Refresh the list
      const updatedList = await individualApi.getByCompany(companyId);
      setAllIndividuals(updatedList.data);
      
      setPaymentDialogOpen(false);
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to process payment');
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
                      {loading ? <Skeleton width={150} /> : `Managing ${filteredData.length} Individuals`}
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
                  <Tooltip title="Print PDF">
                    <IconButton
                      onClick={() => window.print()}
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
                      CR: {company?.crNumber || 'N/A'}
                      {company?.crNumber && (
                        <Tooltip 
                          open={copyFeedback.open && copyFeedback.text === 'CR Number copied!'}
                          title="Copied!"
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
                      GOSI: {company?.gosiNumber || 'N/A'}
                      {company?.gosiNumber && (
                        <Tooltip 
                          open={copyFeedback.open && copyFeedback.text === 'GOSI Number copied!'}
                          title="Copied!"
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
                      Sponsor: {company?.sponserId || 'N/A'}
                      {company?.sponserId && (
                        <Tooltip 
                          open={copyFeedback.open && copyFeedback.text === 'Sponsor copied!'}
                          title="Copied!"
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
                      MOI: {company?.makthabNumber || company?.molNumber || 'N/A'}
                      {(company?.makthabNumber || company?.molNumber) && (
                        <Tooltip 
                          open={copyFeedback.open && copyFeedback.text === 'MOI copied!'}
                          title="Copied!"
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
                  <Tooltip title="Print PDF">
                    <IconButton
                      onClick={() => window.print()}
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
            placeholder="Search individuals..."
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
          
          <FormControl sx={{ display: { xs: 'none', sm: 'block' } }}>
            <InputLabel>Status</InputLabel>
            <Select
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              label="Status"
              startAdornment={<SortIcon color="action" sx={{ mr: 1 }} />}
            >
              <MenuItem value="all">All Status</MenuItem>
              <MenuItem value="active">Active</MenuItem>
              <MenuItem value="expired">Expired</MenuItem>
            </Select>
          </FormControl>

          <FormControl sx={{ display: { xs: 'none', sm: 'block' } }}>
            <InputLabel>Sort By</InputLabel>
            <Select
              value={sort}
              onChange={(e) => setSort(e.target.value)}
              label="Sort By"
              startAdornment={<SortIcon color="action" sx={{ mr: 1 }} />}
            >
              <MenuItem value="name">Name</MenuItem>
              <MenuItem value="expiryDate">Expiry Date</MenuItem>
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
                                <Typography variant="h6" fontWeight="bold">
                                  {individual.name}
                                </Typography>
                                <Typography variant="body2" color="text.secondary">
                                  {individual.nationality}
                                </Typography>
                              </Box>
                            </Box>

                            <Divider sx={{ my: 2 }} />

                            <Grid container spacing={0}>
                              <Grid item xs={12}>
                                <Box display="flex" alignItems="center" gap={1}>
                                  <BadgeIcon sx={{ fontSize: 16, color: 'primary.main' }} />
                                  <Typography variant="body2" color="text.secondary">
                                    Iqama: {individual.iqamaNumber}
                                  </Typography>
                                </Box>
                              </Grid>
                              
                              <Grid item xs={12}>
                                <Box display="flex" alignItems="center" gap={1}>
                                  <CalendarIcon sx={{ fontSize: 16, color: 'primary.main' }} />
                                  <Typography variant="body2" color="text.secondary">
                                    Expiry: {individual.expiryDate ? 
                                      format(new Date(individual.expiryDate), 'dd MMM yyyy') : 
                                      'Not set'}
                                  </Typography>
                                </Box>
                              </Grid>

                              <Grid item xs={12}>
                                <Box display="flex" alignItems="center" gap={1}>
                                  <PhoneIcon sx={{ fontSize: 16, color: 'primary.main' }} />
                                  <Typography variant="body2" color="text.secondary">
                                    Phone: {individual.phoneNumber || 'N/A'}
                                  </Typography>
                                </Box>
                              </Grid>

                              <Grid item xs={12}>
                                <Box display="flex" alignItems="center" gap={1}>
                                  <PersonIcon sx={{ fontSize: 16, color: 'primary.main' }} />
                                  <Typography variant="body2" color="text.secondary">
                                    Referred by: {individual.referredBy || 'N/A'}
                                  </Typography>
                                </Box>
                              </Grid>

                              <Grid item xs={12}>
                                <Box display="flex" alignItems="center" gap={1}>
                                  <MonetizationIcon fontSize="small" color="action" />
                                  <Typography variant="body2" color="text.secondary">
                                    {individual.isFullyPaid ? (
                                      'Fully Paid'
                                    ) : (
                                      `Pending: SAR ${individual.pendingAmount}`
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
                                    label={`${Math.abs(getDaysUntilExpiry(individual.expiryDate))} days ${getDaysUntilExpiry(individual.expiryDate) < 0 ? 'overdue' : 'left'}`}
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
                                {/* <Typography variant="caption" color="text.secondary">
                                  Last updated by {individual.lastUpdatedBy}
                                  {individual.lastUpdateDate && (
                                    <>
                                      {' '}on{' '}
                                      {format(new Date(individual.lastUpdateDate), 'dd MMM yyyy')}
                                    </>
                                  )}
                                </Typography> */}
                              </Grid>
                            </Grid>

                            <Box sx={{ display: 'flex', gap: 1 }}>
                              {user?.isAdmin && (
                                <>
                                  {!individual.isFullyPaid && (
                                    <IconButton
                                      size="small"
                                      onClick={() => handlePayPending(individual)}
                                      sx={{
                                        color: 'warning.main',
                                        bgcolor: 'warning.lighter',
                                        '&:hover': { bgcolor: 'warning.light' }
                                      }}
                                    >
                                      <MonetizationIcon fontSize="small" />
                                    </IconButton>
                                  )}
                                  {individual.isFullyPaid && (
                                    <IconButton
                                      size="small"
                                      onClick={() => handleRenew(individual)}
                                      sx={{
                                        color: 'primary.main',
                                        bgcolor: 'primary.lighter',
                                        '&:hover': { bgcolor: 'primary.light' }
                                      }}
                                    >
                                      <RenewIcon fontSize="small" />
                                    </IconButton>
                                  )}
                                  <IconButton
                                    size="small"
                                    onClick={() => handleEdit(individual)}
                                    sx={{
                                      color: 'info.main',
                                      bgcolor: 'info.lighter',
                                      '&:hover': { bgcolor: 'info.light' }
                                    }}
                                  >
                                    <EditIcon fontSize="small" />
                                  </IconButton>
                                  <IconButton
                                    size="small"
                                    onClick={() => handleDelete(individual)}
                                    sx={{
                                      color: 'error.main',
                                      bgcolor: 'error.lighter',
                                      '&:hover': { bgcolor: 'error.light' }
                                    }}
                                  >
                                    <DeleteIcon fontSize="small" />
                                  </IconButton>
                                </>
                              )}
                            </Box>
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

        {user?.isAdmin && (
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
        )}
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
        title="Confirm Action"
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