import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  Container,
  Box,
  Paper,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Tooltip,
  Grid,
  TextField,
  InputAdornment,
  Button,
  Stack,
  Avatar,
  MenuItem,
  TablePagination,
  Fade,
  Skeleton
} from '@mui/material';
import {
  Person as PersonIcon,
  Business as BusinessIcon,
  AccountCircle as AccountCircleIcon,
  Payment as PaymentIcon,
  Refresh as RefreshIcon,
  Visibility as VisibilityIcon
} from '@mui/icons-material';
import { useAuth } from '../context/AuthContext';
import { individualApi } from '../services/api';

function PendingPayments() {
  const { t } = useTranslation();
  const [pendingPayments, setPendingPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(20);
  const [filters, setFilters] = useState({
    referredBy: '',
    mainPerson: '',
    company: '',
    paymentStatus: 'all' // 'all', 'noPaid', 'partiallyPaid'
  });

  useEffect(() => {
    if (!user?.isAdmin) {
      navigate('/');
      return;
    }
    fetchPendingPayments();
  }, [user]);

  const fetchPendingPayments = async () => {
    try {
      setLoading(true);
      const response = await individualApi.getAll();
      
      // Filter individuals with pending payments
      const pendingPaymentIndividuals = response.data.filter(individual => {
        const totalPaid = individual.totalPaidAmount || 0;
        const iqamaPrice = individual.iqamaPrice || 5000;
        return totalPaid < iqamaPrice;
      });

      setPendingPayments(pendingPaymentIndividuals || []);
    } catch (error) {
      console.error('Error fetching pending payments:', error);
      setError('Failed to load pending payments');
      
      if (error.response?.status === 401) {
        logout();
      }
    } finally {
      setLoading(false);
    }
  };

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const handleFilterChange = (field, value) => {
    setFilters(prev => ({
      ...prev,
      [field]: value
    }));
    setPage(0);
  };

  const getFilteredPayments = () => {
    return pendingPayments.filter(individual => {
      // Filter by referredBy
      if (filters.referredBy && !individual.referredBy?.toLowerCase().includes(filters.referredBy.toLowerCase())) {
        return false;
      }

      // Filter by mainPerson
      if (filters.mainPerson && !individual.mainPerson?.name?.toLowerCase().includes(filters.mainPerson.toLowerCase())) {
        return false;
      }

      // Filter by company
      if (filters.company && !individual.company?.name?.toLowerCase().includes(filters.company.toLowerCase())) {
        return false;
      }

      // Filter by payment status
      if (filters.paymentStatus !== 'all') {
        const totalPaid = individual.totalPaidAmount || 0;
        if (filters.paymentStatus === 'noPaid' && totalPaid > 0) {
          return false;
        }
        if (filters.paymentStatus === 'partiallyPaid' && totalPaid === 0) {
          return false;
        }
      }

      return true;
    });
  };

  if (loading) {
    return (
      <Box sx={{ width: '100%', bgcolor: 'background.default' }}>
        {/* Header Section Skeleton */}
        <Box 
          sx={{ 
            bgcolor: 'primary.light',
            pt: 4,
            pb: 12,
            px: 3,
            position: 'relative'
          }}
        >
          <Container maxWidth="lg">
            <Skeleton variant="text" width={300} height={45} />
          </Container>
        </Box>

        <Container maxWidth="lg" sx={{ mt: -8, position: 'relative', zIndex: 1, mb: 4 }}>
          <Fade in timeout={800}>
            <Box>
              {/* Filters Section Skeleton */}
              <Paper sx={{ p: 3, mb: 3, borderRadius: 3, boxShadow: 3 }}>
                <Grid container spacing={2}>
                  {[1, 2, 3, 4].map((item) => (
                    <Grid item xs={12} sm={6} md={3} key={item}>
                      <Skeleton variant="rounded" height={40} />
                    </Grid>
                  ))}
                </Grid>
                <Box sx={{ mt: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Skeleton variant="text" width={200} />
                  <Skeleton variant="rounded" width={100} height={30} />
                </Box>
              </Paper>

              {/* Table Skeleton */}
              <Paper sx={{ borderRadius: 3, boxShadow: 2 }}>
                <TableContainer>
                  <Table>
                    <TableHead>
                      <TableRow>
                        {[1, 2, 3, 4, 5, 6, 7].map((item) => (
                          <TableCell key={item}>
                            <Skeleton variant="text" width={100} />
                          </TableCell>
                        ))}
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {[1, 2, 3, 4, 5].map((row) => (
                        <TableRow key={row}>
                          {[1, 2, 3, 4, 5, 6, 7].map((cell) => (
                            <TableCell key={cell}>
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                {cell === 3 && <Skeleton variant="circular" width={32} height={32} />}
                                <Box sx={{ flex: 1 }}>
                                  <Skeleton variant="text" width={cell === 3 ? 150 : 100} />
                                  {(cell === 3 || cell === 4) && (
                                    <Skeleton variant="text" width={80} />
                                  )}
                                </Box>
                              </Box>
                            </TableCell>
                          ))}
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
                {/* Pagination Skeleton */}
                <Box sx={{ py: 2, px: 2, display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: 2 }}>
                  <Skeleton variant="text" width={100} />
                  <Skeleton variant="rounded" width={100} height={30} />
                  <Skeleton variant="rounded" width={200} height={30} />
                </Box>
              </Paper>
            </Box>
          </Fade>
        </Container>
      </Box>
    );
  }

  if (error) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Paper sx={{ p: 4, textAlign: 'center', borderRadius: 3 }}>
          <Typography color="error" gutterBottom>
            {error}
          </Typography>
          <Button
            variant="contained"
            onClick={fetchPendingPayments}
            startIcon={<RefreshIcon />}
          >
            {t('common.tryAgain')}
          </Button>
        </Paper>
      </Container>
    );
  }

  const filteredPayments = getFilteredPayments();
  const paginatedPayments = filteredPayments.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);

  return (
    <Box sx={{ width: '100%', bgcolor: 'background.default' }}>
      {/* Header Section with Background */}
      <Box 
        sx={{ 
          bgcolor: 'primary.light',
          pt: 4,
          pb: 12,
          px: 3,
          position: 'relative'
        }}
      >
        <Container maxWidth="lg">
          <Typography 
            variant="h4" 
            sx={{
              fontWeight: 700,
              color: 'primary.dark',
            }}
          >
            {t('adminNotifications.tabs.pendingPayments', { count: pendingPayments.length })}
          </Typography>
        </Container>
      </Box>

      <Container 
        maxWidth="lg" 
        sx={{ 
          mt: -8,
          position: 'relative',
          zIndex: 1,
          mb: 4
        }}
      >
        <Fade in timeout={800}>
          <Box>
            {/* Filters Section */}
            <Paper 
              sx={{ 
                p: 3,
                borderRadius: 3,
                boxShadow: 3,
                mb: 3,
                bgcolor: 'background.paper',
              }}
            >
              <Grid container spacing={2} alignItems="center">
                <Grid item xs={12} sm={6} md={3}>
                  <TextField
                    fullWidth
                    size="small"
                    label={t('adminNotifications.filters.referredBy')}
                    value={filters.referredBy}
                    onChange={(e) => handleFilterChange('referredBy', e.target.value)}
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <PersonIcon sx={{ fontSize: 20 }} />
                        </InputAdornment>
                      ),
                    }}
                  />
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                  <TextField
                    fullWidth
                    size="small"
                    label={t('adminNotifications.filters.mainPerson')}
                    value={filters.mainPerson}
                    onChange={(e) => handleFilterChange('mainPerson', e.target.value)}
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <AccountCircleIcon sx={{ fontSize: 20 }} />
                        </InputAdornment>
                      ),
                    }}
                  />
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                  <TextField
                    fullWidth
                    size="small"
                    label={t('adminNotifications.filters.company')}
                    value={filters.company}
                    onChange={(e) => handleFilterChange('company', e.target.value)}
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <BusinessIcon sx={{ fontSize: 20 }} />
                        </InputAdornment>
                      ),
                    }}
                  />
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                  <TextField
                    fullWidth
                    select
                    size="small"
                    label={t('adminNotifications.filters.paymentStatus')}
                    value={filters.paymentStatus}
                    onChange={(e) => handleFilterChange('paymentStatus', e.target.value)}
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <PaymentIcon sx={{ fontSize: 20 }} />
                        </InputAdornment>
                      ),
                    }}
                  >
                    <MenuItem value="all">{t('adminNotifications.filters.all')}</MenuItem>
                    <MenuItem value="noPaid">{t('adminNotifications.filters.noPaid')}</MenuItem>
                    <MenuItem value="partiallyPaid">{t('adminNotifications.filters.partiallyPaid')}</MenuItem>
                  </TextField>
                </Grid>
              </Grid>
              <Box sx={{ mt: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Typography variant="body2" color="text.secondary">
                  {t('adminNotifications.filters.showing', { count: filteredPayments.length, total: pendingPayments.length })}
                </Typography>
                <Button
                  size="small"
                  startIcon={<RefreshIcon />}
                  onClick={() => {
                    setFilters({
                      referredBy: '',
                      mainPerson: '',
                      company: '',
                      paymentStatus: 'all'
                    });
                    setPage(0);
                  }}
                >
                  {t('adminNotifications.filters.reset')}
                </Button>
              </Box>
            </Paper>

            {/* Table Section */}
            {pendingPayments.length === 0 ? (
              <Paper sx={{ p: 4, textAlign: 'center', borderRadius: 3 }}>
                <PaymentIcon sx={{ fontSize: 64, color: 'text.disabled', mb: 2 }} />
                <Typography variant="h6" color="text.secondary">
                  {t('adminNotifications.noResults.title')}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {t('adminNotifications.noResults.pendingPayments')}
                </Typography>
              </Paper>
            ) : (
              <>
                <TableContainer component={Paper} sx={{ borderRadius: 3, boxShadow: 2 }}>
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableCell>{t('adminNotifications.table.mainPerson')}</TableCell>
                        <TableCell>{t('adminNotifications.table.referredBy')}</TableCell>
                        <TableCell>{t('adminNotifications.table.individual')}</TableCell>
                        <TableCell>{t('adminNotifications.table.company')}</TableCell>
                        <TableCell>{t('adminNotifications.table.paidAmount')}</TableCell>
                        <TableCell>{t('adminNotifications.table.pendingAmount')}</TableCell>
                        <TableCell align="right">{t('adminNotifications.table.actions')}</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {paginatedPayments.map((individual) => (
                        <TableRow 
                          key={individual._id}
                          sx={{ 
                            '&:last-child td, &:last-child th': { border: 0 },
                            transition: 'background-color 0.2s',
                            '&:hover': {
                              backgroundColor: 'action.hover'
                            }
                          }}
                        >
                          <TableCell>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                              <PersonIcon sx={{ fontSize: 16, color: 'primary.main' }} />
                              <Typography variant="body2">
                                {individual.mainPerson?.name || '-'}
                              </Typography>
                            </Box>
                          </TableCell>
                          <TableCell>
                            <Typography variant="body2">
                              {individual.referredBy || '-'}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                              <Avatar 
                                sx={{ 
                                  width: 32, 
                                  height: 32,
                                  bgcolor: '#e3f2fd',
                                  color: '#1976d2'
                                }}
                              >
                                {individual.name?.charAt(0).toUpperCase()}
                              </Avatar>
                              <Box>
                                <Typography variant="subtitle2">
                                  {individual.name}
                                </Typography>
                                <Typography variant="caption" color="text.secondary">
                                  {individual.iqamaNumber}
                                </Typography>
                              </Box>
                            </Box>
                          </TableCell>
                          <TableCell>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                              <BusinessIcon sx={{ fontSize: 16, color: 'primary.main' }} />
                              <Stack>
                                <Typography variant="body2">
                                  {individual.company?.name || '-'}
                                </Typography>
                                <Typography variant="caption" color="text.secondary">
                                  {t('adminNotifications.details.crNumber')}: {individual.company?.crNumber || '-'}
                                </Typography>
                              </Stack>
                            </Box>
                          </TableCell>
                          <TableCell>
                            <Typography variant="body2" color="success.main" sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                              <PaymentIcon sx={{ fontSize: 16 }} />
                              SAR {individual.totalPaidAmount || 0}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Typography variant="body2" color="error.main" sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                              <PaymentIcon sx={{ fontSize: 16 }} />
                              SAR {individual.pendingAmount || (individual.iqamaPrice - (individual.totalPaidAmount || 0))}
                            </Typography>
                          </TableCell>
                          <TableCell align="right">
                            <Tooltip title={t('adminNotifications.actions.view')}>
                              <IconButton
                                size="small"
                                color="primary"
                                onClick={() => navigate(`/individuals/${individual._id}`)}
                                sx={{ 
                                  bgcolor: '#e3f2fd',
                                  '&:hover': { bgcolor: '#bbdefb' }
                                }}
                              >
                                <VisibilityIcon fontSize="small" />
                              </IconButton>
                            </Tooltip>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
                <TablePagination
                  component="div"
                  count={filteredPayments.length}
                  page={page}
                  onPageChange={handleChangePage}
                  rowsPerPage={rowsPerPage}
                  onRowsPerPageChange={handleChangeRowsPerPage}
                  rowsPerPageOptions={[10, 20, 50]}
                  labelRowsPerPage={t('common.pagination.rowsPerPage')}
                  labelDisplayedRows={({ from, to, count }) => 
                    t('common.pagination.displayedRows', { from, to, count })
                  }
                  sx={{
                    '.MuiTablePagination-select': {
                      paddingTop: '6px',
                    },
                    '.MuiTablePagination-displayedRows': {
                      margin: '0 16px',
                    }
                  }}
                />
              </>
            )}
          </Box>
        </Fade>
      </Container>
    </Box>
  );
}

export default PendingPayments; 