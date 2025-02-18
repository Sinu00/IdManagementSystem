import { useState, useEffect, useMemo } from 'react';
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
  Stack
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
  Login as LoginIcon,
  Badge as BadgeIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Add as AddIcon,
  Warning as WarningIcon,
  Notifications as NotificationsIcon,
  CheckCircle as CheckCircleIcon
} from '@mui/icons-material';
import { companyApi } from '../services/api';
import { useAuth } from '../context/AuthContext';
import ProfileMenu from '../components/ProfileMenu';
import ConfirmDialog from '../components/dialogs/ConfirmDialog';
import CompanyDialog from '../components/dialogs/CompanyDialog';

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
  const [companies, setCompanies] = useState([]);
  const [loading, setLoading] = useState(true);
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
      setConfirmDialogOpen(true);
    } catch (error) {
      console.error('Error in handleSubmit:', error);
      setDialogError(error.message || 'An error occurred');
    }
  };

  if (loading) {
    return (
      <Box 
        sx={{ 
          width: '100%',
          minHeight: '100vh',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          bgcolor: 'background.default'
        }}
      >
        <CircularProgress size={40} />
      </Box>
    );
  }

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
        {mainPerson && (
          <Fade in timeout={800}>
            <Paper 
              elevation={0}
              sx={{ 
                p: 3,
                mb: 4,
                borderRadius: 3,
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
                      {mainPerson.name}
                    </Typography>
                    <Typography variant="body2">
                      Managing {companies.length} Companies
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Total Individuals: {calculateTotalCounts(companies).total}
                    </Typography>
                  </Box>
                </Box>

                {/* Right Section - Summary Cards and Profile Menu */}
                <Stack 
                  direction="row" 
                  spacing={2} 
                  alignItems="center"
                >
                  <Paper 
                    elevation={0}
                    onClick={() => navigate(`/expired-ids/${mainPerson._id}`)}
                    sx={{ 
                      px: 2,
                      py: 1,
                      bgcolor: 'error.main',
                      borderRadius: 2,
                      display: 'flex',
                      alignItems: 'center',
                      gap: 1,
                      minWidth: 100,
                      cursor: 'pointer',
                      transition: 'transform 0.2s ease-in-out',
                      '&:hover': {
                        transform: 'scale(1.05)',
                        boxShadow: theme.shadows[4]
                      }
                    }}
                  >
                    <WarningIcon sx={{ color: 'white', fontSize: 20 }} />
                    <Box>
                      <Typography variant="h6" color="white" fontWeight="bold">
                        {calculateTotalCounts(companies).expired}
                      </Typography>
                      <Typography variant="caption" color="white">
                        Expired
                      </Typography>
                    </Box>
                  </Paper>

                  <Paper 
                    elevation={0}
                    onClick={() => navigate(`/expiring-soon/${mainPerson._id}`)}
                    sx={{ 
                      px: 2,
                      py: 1,
                      bgcolor: 'warning.main',
                      borderRadius: 2,
                      display: 'flex',
                      alignItems: 'center',
                      gap: 1,
                      minWidth: 100,
                      cursor: 'pointer',
                      transition: 'transform 0.2s ease-in-out',
                      '&:hover': {
                        transform: 'scale(1.05)',
                        boxShadow: theme.shadows[4]
                      }
                    }}
                  >
                    <NotificationsIcon sx={{ color: 'white', fontSize: 20 }} />
                    <Box>
                      <Typography variant="h6" color="white" fontWeight="bold">
                        {calculateTotalCounts(companies).expiringSoon}
                      </Typography>
                      <Typography variant="caption" color="white">
                        Expiring
                      </Typography>
                    </Box>
                  </Paper>

                  <ProfileMenu 
                    username={user?.username}
                    onLogout={handleLogout}
                  />
                </Stack>
              </Box>
            </Paper>
          </Fade>
        )}

        <Box 
          sx={{ 
            display: 'flex', 
            gap: 2, 
            mb: 4, 
            flexDirection: { xs: 'column', sm: 'row' },
            backgroundColor: 'white',
            p: 2,
            borderRadius: 2,
            boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
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
          
          <FormControl sx={{ minWidth: 180 }}>
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

          <FormControl sx={{ minWidth: 180 }}>
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
          <Grid container spacing={3}>
            {filteredAndSortedCompanies.map((company) => (
              <Grid item xs={12} sm={6} md={4} key={company._id}>
                <Card 
                  onClick={() => navigate(`/company/${company._id}/individuals`)}
                  sx={{ 
                    height: '100%',
                    cursor: 'pointer',
                    transition: 'all 0.3s ease-in-out',
                    borderRadius: 3,
                    position: 'relative',
                    '&:hover': {
                      transform: 'translateY(-4px)',
                      boxShadow: theme.shadows[8]
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
                          <BadgeIcon sx={{ fontSize: 16, mr: 1, verticalAlign: 'text-bottom' }} />
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