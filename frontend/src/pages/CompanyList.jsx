import { useState, useEffect, useMemo, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box,
  Container,
  TextField,
  IconButton,
  Grid,
  Card,
  CardContent,
  Typography,
  InputAdornment,
  CircularProgress,
  Fade,
  Chip,
  useTheme,
  Paper,
  Divider,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Avatar,
  Button,
  Fab,
  Stack,
  Tooltip,
  Skeleton,
  Pagination
} from '@mui/material';
import {
  Search as SearchIcon,
  Business as BusinessIcon,
  LocationOn as LocationIcon,
  Phone as PhoneIcon,
  ArrowForward as ArrowForwardIcon,
  Sort as SortIcon,
  FilterList as FilterListIcon,
  Person as PersonIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Add as AddIcon,
  Warning as WarningIcon,
  Notifications as NotificationsIcon,
  CheckCircle as CheckCircleIcon,
  PictureAsPdf as PdfIcon,
  Error as ErrorIcon,
} from '@mui/icons-material';
import { companyApi } from '../services/api';
import { useAuth } from '../context/AuthContext';
import ProfileMenu from '../components/ProfileMenu';
import ConfirmDialog from '../components/dialogs/ConfirmDialog';
import CompanyDialog from '../components/dialogs/CompanyDialog';
import { CompanyCardSkeletonList } from '../components/skeletons/CompanyCardSkeleton';
import LoadingScreen from '../components/common/LoadingScreen';

function calculateTotalCounts(companies) {
  return companies.reduce((totals, company) => {
    return {
      expired: totals.expired + (company.redCards || 0),
      expiringSoon: totals.expiringSoon + (company.orangeCards || 0),
      safe: totals.safe + (company.greenCards || 0),
      total: totals.total + (company.totalIndividuals || 0)
    };
  }, { expired: 0, expiringSoon: 0, safe: 0, total: 0 });
}

function CompanyList() {
  const [loading, setLoading] = useState(true);
  const [companies, setCompanies] = useState([]);
  const [search, setSearch] = useState('');
  const [sort, setSort] = useState('name');
  const [filter, setFilter] = useState('all');
  const { id: mainPersonId } = useParams();
  const navigate = useNavigate();
  const theme = useTheme();
  const [mainPerson, setMainPerson] = useState(null);
  const { user, logout } = useAuth();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedCompany, setSelectedCompany] = useState(null);
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);
  const [confirmMessage, setConfirmMessage] = useState('');
  const [confirmAction, setConfirmAction] = useState(null);
  const [dialogMode, setDialogMode] = useState('add');
  const [dialogError, setDialogError] = useState('');
  const [page, setPage] = useState(1);
  const [itemsPerPage] = useState(15);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const response = await companyApi.getByMainPerson(mainPersonId);
        setCompanies(response.data);
        if (response.data.length > 0) {
          setMainPerson(response.data[0].mainPerson);
        }
      } catch (error) {
        console.error('Error fetching companies:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [mainPersonId]);

  const filteredAndSortedCompanies = useMemo(() => {
    return companies
    .filter(company => {
        if (filter === 'withExpiring') {
          return (company.orangeCards || 0) > 0;
        }
        if (filter === 'withExpired') {
          return (company.redCards || 0) > 0;
        }
      return true;
    })
      .filter(company => {
        if (!search) return true;
        
        const searchTerm = search.toLowerCase();
        const companyName = company.name.toLowerCase();
        
        return (
          companyName.includes(searchTerm) ||
          company.crNumber?.toLowerCase().includes(searchTerm) ||
          company.sponserId?.toLowerCase().includes(searchTerm) ||
          company.gosiNumber?.toLowerCase().includes(searchTerm) ||
          company.molNumber?.toLowerCase().includes(searchTerm) ||
          company.makthabNumber?.toLowerCase().includes(searchTerm)
        );
      })
    .sort((a, b) => {
        switch (sort) {
          case 'name':
            return a.name.localeCompare(b.name, ['ar', 'en']);
          case 'expiringCount':
            const aExpiring = (a.orangeCards || 0);
            const bExpiring = (b.orangeCards || 0);
            return bExpiring - aExpiring;
          case 'expiredCount':
            const aExpired = (a.redCards || 0);
            const bExpired = (b.redCards || 0);
            return bExpired - aExpired;
          case 'totalCount':
            const aTotal = (a.redCards || 0) + (a.orangeCards || 0) + (a.greenCards || 0);
            const bTotal = (b.redCards || 0) + (b.orangeCards || 0) + (b.greenCards || 0);
            return bTotal - aTotal;
          default:
      return 0;
        }
      });
  }, [companies, filter, search, sort]);

  const paginatedCompanies = useMemo(() => {
    const startIndex = (page - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return filteredAndSortedCompanies.slice(startIndex, endIndex);
  }, [filteredAndSortedCompanies, page, itemsPerPage]);

  const handleLogout = () => {
    logout();
  };

  const handleAdd = () => {
    setSelectedCompany(null);
    setDialogMode('add');
    setDialogError('');
    setDialogOpen(true);
  };

  const handleEdit = (company) => {
    setSelectedCompany(company);
    setDialogMode('edit');
    setDialogError('');
    setDialogOpen(true);
  };

  const handleDelete = (company) => {
    setSelectedCompany(company);
    setConfirmMessage(`Are you sure you want to delete ${company.name}?`);
    setConfirmAction(() => () => handleConfirmDelete(company));
    setConfirmDialogOpen(true);
  };

  const handleConfirmDelete = async (company) => {
    try {
      await companyApi.delete(company._id);
      const response = await companyApi.getByMainPerson(mainPersonId);
      setCompanies(response.data);
      setConfirmDialogOpen(false);
    } catch (error) {
      console.error('Error deleting company:', error);
      setError('Failed to delete company');
    }
  };

  const handleSubmit = async (formData) => {
    try {
      setDialogError('');
      const message = dialogMode === 'add' 
        ? 'Are you sure you want to add this company?' 
        : `Are you sure you want to update ${selectedCompany.name}'s information?`;
      
      setConfirmMessage(message);
      setConfirmAction(() => async () => {
        try {
          if (dialogMode === 'add') {
            await companyApi.create({ ...formData, mainPerson: mainPersonId });
          } else {
            await companyApi.update(selectedCompany._id, formData);
          }
          
          const response = await companyApi.getByMainPerson(mainPersonId);
          setCompanies(response.data);
          setDialogOpen(false);
          setConfirmDialogOpen(false);
          setDialogError('');
        } catch (error) {
          console.error('Error saving company:', error);
          setDialogError(error.response?.data?.message || 'Failed to save company');
          setConfirmDialogOpen(false);
        }
      });

      // Clear any existing keypress handlers before showing confirm dialog
      window.removeEventListener('keypress', handleConfirmKeyPress);
      setConfirmDialogOpen(true);
      
      // Focus the confirm button in the confirmation dialog
      setTimeout(() => {
        const confirmButton = document.querySelector('[data-confirm-action="true"]');
        if (confirmButton) {
          confirmButton.focus();
        }
      }, 100);
    } catch (error) {
      console.error('Error in handleSubmit:', error);
      setDialogError(error.message || 'An error occurred');
    }
  };

  // Add handler for confirmation dialog Enter key
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

  const handlePageChange = (event, newPage) => {
    setPage(newPage);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <Box 
      sx={{ 
        width: '100%',
        minHeight: '100vh',
        bgcolor: 'background.default',
        pt: 4,
        pb: 6
      }}
    >
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
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: 2
            }}>
              {/* Left Section - Main Person Info */}
              <Box display="flex" alignItems="center" gap={2}>
                <Avatar sx={{ bgcolor: 'primary.main', width: 48, height: 48 }}>
                  <PersonIcon />
                </Avatar>
                <Box>
                  <Typography variant="h6" fontWeight="bold">
                    {mainPerson?.name || <Skeleton width={200} />}
                  </Typography>
                  <Typography variant="body2">
                    {loading ? <Skeleton width={150} /> : `Managing ${companies.length} Companies`}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {loading ? (
                      <Skeleton width={180} />
                    ) : (
                      `Total Individuals: ${calculateTotalCounts(companies).total}`
                    )}
                  </Typography>
                </Box>
              </Box>

              {/* Right Section - Summary Cards and Profile Menu */}
              <Stack 
                direction="row" 
                spacing={2} 
                alignItems="center"
                sx={{
                  width: { xs: '100%', sm: 'auto' },  // Full width on mobile
                  justifyContent: { xs: 'space-between', sm: 'flex-start' }  // Space between on mobile
                }}
              >
                {/* Left side buttons wrapper */}
                <Box sx={{ display: 'flex', gap: 2 }}>
                  <Tooltip title="View Expired IDs">
                    <Box sx={{ position: 'relative' }}>
                      <IconButton
                        size="small"
                        onClick={() => navigate(`/expired-ids/${mainPerson._id}`)}
                        sx={{ 
                          bgcolor: 'error.main',
                          color: 'white',
                          transition: 'all 0.2s ease-in-out',
                          '&:hover': {
                            bgcolor: 'error.dark',
                            transform: 'scale(1.1)',
                            boxShadow: theme.shadows[4]
                          }
                        }}
                      >
                        <Avatar sx={{ 
                          width: 32, 
                          height: 32,
                          bgcolor: 'inherit',
                          color: 'inherit'
                        }}>
                          <ErrorIcon sx={{ fontSize: 20 }} />
                        </Avatar>
                      </IconButton>
                      {calculateTotalCounts(companies).expired > 0 && (
                        <Box
                          sx={{
                            position: 'absolute',
                            top: -5,
                            right: -5,
                            bgcolor: 'white',
                            color: 'error.main',
                            borderRadius: '50%',
                            width: 20,
                            height: 20,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: '0.75rem',
                            fontWeight: 'bold',
                            boxShadow: theme.shadows[2],
                            border: '2px solid',
                            borderColor: 'error.main',
                            zIndex: 1
                          }}
                        >
                          {calculateTotalCounts(companies).expired}
                        </Box>
                      )}
                    </Box>
                  </Tooltip>

                  <Tooltip title="View Expiring Soon IDs">
                    <Box sx={{ position: 'relative' }}>
                      <IconButton
                        size="small"
                        onClick={() => navigate(`/expiring-soon/${mainPerson._id}`)}
                        sx={{ 
                          bgcolor: 'warning.main',
                          color: 'white',
                          transition: 'all 0.2s ease-in-out',
                          '&:hover': {
                            bgcolor: 'warning.dark',
                            transform: 'scale(1.1)',
                            boxShadow: theme.shadows[4]
                          }
                        }}
                      >
                        <Avatar sx={{ 
                          width: 32, 
                          height: 32,
                          bgcolor: 'inherit',
                          color: 'inherit'
                        }}>
                          <WarningIcon sx={{ fontSize: 20 }} />
                        </Avatar>
                      </IconButton>
                      {calculateTotalCounts(companies).expiringSoon > 0 && (
                        <Box
                          sx={{
                            position: 'absolute',
                            top: -5,
                            right: -5,
                            bgcolor: 'white',
                            color: 'warning.main',
                            borderRadius: '50%',
                            width: 20,
                            height: 20,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: '0.75rem',
                            fontWeight: 'bold',
                            boxShadow: theme.shadows[2],
                            border: '2px solid',
                            borderColor: 'warning.main',
                            zIndex: 1
                          }}
                        >
                          {calculateTotalCounts(companies).expiringSoon}
                        </Box>
                      )}
                    </Box>
                  </Tooltip>
                </Box>

                <Stack 
                  direction="row" 
                  spacing={2}
                  alignItems="center"
                  justifyContent="center"
                >
                  <Tooltip title="Print PDF">
                    <IconButton
                      onClick={() => window.print()}
                      size="small"
                      sx={{ 
                        ml: 2,
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
            placeholder="البحث عن الشركات..."
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
              },
              '& .MuiInputBase-input': {
                direction: 'rtl',
                textAlign: 'right'
              }
            }}
          />
          
          <FormControl sx={{ display: { xs: 'none', sm: 'block' } }}>
            <InputLabel>Filter Status</InputLabel>
            <Select
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              label="Filter Status"
              startAdornment={<FilterListIcon color="action" sx={{ mr: 1 }} />}
            >
              <MenuItem value="all">All Companies</MenuItem>
              <MenuItem value="withExpiring">Has Expiring IDs</MenuItem>
              <MenuItem value="withExpired">Has Expired IDs</MenuItem>
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
              <MenuItem value="name">Company Name</MenuItem>
              <MenuItem value="expiringCount">Expiring IDs</MenuItem>
              <MenuItem value="expiredCount">Expired IDs</MenuItem>
              <MenuItem value="totalCount">Total IDs</MenuItem>
            </Select>
          </FormControl>
        </Box>

        <Fade in timeout={1000}>
          <Box>
            {loading ? (
              <CompanyCardSkeletonList count={6} />
            ) : (
              <>
              <Grid container spacing={3}>
                  {paginatedCompanies.map((company) => (
                  <Grid item xs={12} sm={6} md={4} key={company._id}>
                    <Card 
                      onClick={() => navigate(`/company/${company._id}/individuals`)}
                      sx={{ 
                        height: '100%',
                        cursor: 'pointer',
                        transition: 'all 0.3s ease-in-out',
                        borderRadius: 3,
                        position: 'relative',
                        '@media (hover: hover)': {
                          '&:hover': {
                            transform: 'translateY(-4px)',
                            boxShadow: theme.shadows[8]
                          }
                        }
                      }}
                    >
                      <Box sx={{ height: 6, bgcolor: 'primary.main', width: '100%' }} />
                      <CardContent sx={{ p: 3 }}>
                        {/* Header Section */}
                        <Box display="flex" alignItems="center" gap={1} mb={2}>

                          <Box flex={1}>
                            <Typography variant="h5" fontWeight="bold">
                              {company.name}
                            </Typography>
                          </Box>
                          <Avatar 
                            sx={{ 
                              bgcolor: 'primary.light',
                              color: 'primary.main',
                              width: 56,
                              height: 56
                            }}
                          >
                            <BusinessIcon fontSize="large" />
                          </Avatar>
                        </Box>

                        <Divider sx={{ my: 2 }} />

                        {/* Company Details Grid */}
                        <Grid container spacing={2}>
                          <Grid item xs={6}>
                            <Typography variant="body2" color="text.secondary" gutterBottom>
                              <BusinessIcon sx={{ fontSize: 16, mr: 1, verticalAlign: 'text-bottom' }} />
                              CR: {company.crNumber || 'N/A'}
                            </Typography>
                            <Typography variant="body2" color="text.secondary" gutterBottom>
                              <PersonIcon sx={{ fontSize: 16, mr: 1, verticalAlign: 'text-bottom' }} />
                              Sponsor: {company.sponserId || 'N/A'}
                            </Typography>
                          </Grid>
                          <Grid item xs={6}>
                            <Typography variant="body2" color="text.secondary" gutterBottom>
                              <ErrorIcon sx={{ fontSize: 16, mr: 1, verticalAlign: 'text-bottom' }} />
                              GOSI: {company.gosiNumber || 'N/A'}
                            </Typography>
                            <Typography variant="body2" color="text.secondary" gutterBottom>
                              <LocationIcon sx={{ fontSize: 16, mr: 1, verticalAlign: 'text-bottom' }} />
                              MOL: {company.molNumber || 'N/A'}
                            </Typography>
                          </Grid>
                        </Grid>

                        {/* Status Cards */}
                        <Box sx={{ mt: 3 }}>
                          <Grid container spacing={2}>
                            <Grid item xs={4}>
                              <Box
                                sx={{ 
                                  p: 1.5, 
                                  bgcolor: 'error.lighter',
                                  borderRadius: 2,
                                  display: 'flex',
                                  flexDirection: 'column',
                                  alignItems: 'center',
                                  position: 'relative',
                                  overflow: 'hidden',
                                  '&:hover': {
                                    transform: 'translateY(-3px)',
                                    transition: 'transform 0.2s ease-in-out'
                                  },
                                  '&::before': {
                                    content: '""',
                                    position: 'absolute',
                                    top: 0,
                                    left: 0,
                                    width: '100%',
                                    height: '2px',
                                    bgcolor: 'error.main'
                                  }
                                }}
                              >
                                <Typography 
                                  variant="h5" 
                                  color="error.dark" 
                                  fontWeight="bold"
                                  sx={{ mb: 0.5 }}
                                >
                                  {company.redCards || 0}
                                </Typography>
                                <Typography 
                                  variant="caption" 
                                  color="error.dark" 
                                  fontWeight="medium"
                                  sx={{ 
                                    whiteSpace: 'nowrap',
                                    fontSize: '0.7rem'
                                  }}
                                >
                                  Expired
                                </Typography>
                              </Box>
                            </Grid>

                            <Grid item xs={4}>
                              <Box
                                sx={{ 
                                  p: 1.5, 
                                  bgcolor: 'warning.lighter',
                                  borderRadius: 2,
                                  display: 'flex',
                                  flexDirection: 'column',
                                  alignItems: 'center',
                                  position: 'relative',
                                  overflow: 'hidden',
                                  '&:hover': {
                                    transform: 'translateY(-3px)',
                                    transition: 'transform 0.2s ease-in-out'
                                  },
                                  '&::before': {
                                    content: '""',
                                    position: 'absolute',
                                    top: 0,
                                    left: 0,
                                    width: '100%',
                                    height: '2px',
                                    bgcolor: 'warning.main'
                                  }
                                }}
                              >
                                <Typography 
                                  variant="h5" 
                                  color="warning.dark" 
                                  fontWeight="bold"
                                  sx={{ mb: 0.5 }}
                                >
                                  {company.orangeCards || 0}
                                </Typography>
                                <Typography 
                                  variant="caption" 
                                  color="warning.dark" 
                                  fontWeight="medium"
                                  sx={{ 
                                    whiteSpace: 'nowrap',
                                    fontSize: '0.7rem'
                                  }}
                                >
                                  Warning
                                </Typography>
                              </Box>
                            </Grid>

                            <Grid item xs={4}>
                              <Box
                                sx={{ 
                                  p: 1.5, 
                                  bgcolor: 'success.lighter',
                                  borderRadius: 2,
                                  display: 'flex',
                                  flexDirection: 'column',
                                  alignItems: 'center',
                                  position: 'relative',
                                  overflow: 'hidden',
                                  '&:hover': {
                                    transform: 'translateY(-3px)',
                                    transition: 'transform 0.2s ease-in-out'
                                  },
                                  '&::before': {
                                    content: '""',
                                    position: 'absolute',
                                    top: 0,
                                    left: 0,
                                    width: '100%',
                                    height: '2px',
                                    bgcolor: 'success.main'
                                  }
                                }}
                              >
                                <Typography 
                                  variant="h5" 
                                  color="success.dark" 
                                  fontWeight="bold"
                                  sx={{ mb: 0.5 }}
                                >
                                 {company.totalIndividuals || 0}
                                </Typography>
                                <Typography 
                                  variant="caption" 
                                  color="success.dark" 
                                  fontWeight="medium"
                                  sx={{ 
                                    whiteSpace: 'nowrap',
                                    fontSize: '0.7rem'
                                  }}
                                >
                                  Total IDs
                                </Typography>
                              </Box>
                            </Grid>
                          </Grid>
                        </Box>

                        {/* Admin Actions */}
                        {user?.isAdmin && (
                          <Box 
                            sx={{ 
                              position: 'absolute',
                              top: 12,
                              right: 12,
                              display: 'flex',
                              gap: 1,
                              zIndex: 2
                            }}
                          >
                            <IconButton 
                              size="small" 
                              color="primary"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleEdit(company);
                              }}
                              sx={{ 
                                bgcolor: 'background.paper',
                                boxShadow: 1,
                                '&:hover': {
                                  transform: 'scale(1.1)',
                                  bgcolor: 'primary.lighter'
                                }
                              }}
                            >
                              <EditIcon fontSize="small" />
                            </IconButton>
                            <IconButton 
                              size="small" 
                              color="error"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDelete(company);
                              }}
                              sx={{ 
                                bgcolor: 'background.paper',
                                boxShadow: 1,
                                '&:hover': {
                                  transform: 'scale(1.1)',
                                  bgcolor: 'error.lighter'
                                }
                              }}
                            >
                              <DeleteIcon fontSize="small" />
                            </IconButton>
                          </Box>
                        )}
                      </CardContent>
                    </Card>
                  </Grid>
                ))}
              </Grid>
                
                <Box
                  sx={{
                    mt: 4,
                    mb: 4,
                    display: 'flex',
                    justifyContent: 'center',
                    '@media print': {
                      display: 'none'
                    }
                  }}
                >
                  <Pagination
                    count={Math.ceil(filteredAndSortedCompanies.length / itemsPerPage)}
                    page={page}
                    onChange={handlePageChange}
                    color="primary"
                    size="large"
                    showFirstButton
                    showLastButton
                  />
                </Box>
              </>
            )}
          </Box>
        </Fade>

        {user?.isAdmin && (
          <Fab
            color="primary"
            sx={{
              position: 'fixed',
              bottom: 24,
              right: 24
            }}
            onClick={handleAdd}
          >
            <AddIcon />
          </Fab>
        )}
      </Container>

      <CompanyDialog
        open={dialogOpen}
        onClose={() => {
          setDialogOpen(false);
          setDialogError('');
        }}
        onSubmit={handleSubmit}
        company={selectedCompany}
        mode={dialogMode}
        error={dialogError}
      />

      <ConfirmDialog
        open={confirmDialogOpen}
        onClose={() => setConfirmDialogOpen(false)}
        onConfirm={confirmAction}
        title="Confirm Action"
        message={confirmMessage}
      />
    </Box>
  );
}

export default CompanyList; 