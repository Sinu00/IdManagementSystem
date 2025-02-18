import { useState, useEffect } from 'react';
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
  Fab
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
  const { admin, logout, username } = useAuth();
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

  const filteredAndSortedCompanies = companies
    .filter(company => {
      if (filter === 'all') return true;
      if (filter === 'withExpiring') return company.hasExpiringIds;
      if (filter === 'withExpired') return company.hasExpiredIds;
      return true;
    })
    .sort((a, b) => {
      if (sort === 'name') return a.name.localeCompare(b.name);
      if (sort === 'expiringCount') return (b.expiringCount || 0) - (a.expiringCount || 0);
      if (sort === 'totalIds') return (b.individuals?.length || 0) - (a.individuals?.length || 0);
      return 0;
    })
    .filter(company =>
      company.name.toLowerCase().includes(search.toLowerCase()) ||
      company.address.toLowerCase().includes(search.toLowerCase())
    );

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
              <Box display="flex" alignItems="center" gap={3}>
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
                <Box display="flex" alignItems="center" gap={2} ml="auto">
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

                  <Paper 
                    elevation={0}
                    sx={{ 
                      px: 2,
                      py: 1,
                      bgcolor: 'success.main',
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
                    <CheckCircleIcon sx={{ color: 'white', fontSize: 20 }} />
                    <Box>
                      <Typography variant="h6" color="white" fontWeight="bold">
                        {calculateTotalCounts(companies).safe}
                      </Typography>
                      <Typography variant="caption" color="white">
                        Valid
                      </Typography>
                    </Box>
                  </Paper>

                  {admin && (
                    <ProfileMenu 
                      username={username} 
                      onLogout={handleLogout}
                    />
                  )}
                </Box>
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
            placeholder="Search companies..."
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
          
          <FormControl sx={{ minWidth: 150 }}>
            <InputLabel>Filter</InputLabel>
            <Select
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              label="Filter"
              startAdornment={<FilterListIcon color="action" sx={{ mr: 1 }} />}
            >
              <MenuItem value="all">All Companies</MenuItem>
              <MenuItem value="withExpiring">With Expiring IDs</MenuItem>
              <MenuItem value="withExpired">With Expired IDs</MenuItem>
            </Select>
          </FormControl>

          <FormControl sx={{ minWidth: 150 }}>
            <InputLabel>Sort By</InputLabel>
            <Select
              value={sort}
              onChange={(e) => setSort(e.target.value)}
              label="Sort By"
              startAdornment={<SortIcon color="action" sx={{ mr: 1 }} />}
            >
              <MenuItem value="name">Name</MenuItem>
              <MenuItem value="expiringCount">Expiring IDs</MenuItem>
              <MenuItem value="totalIds">Total IDs</MenuItem>
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
                    <Box display="flex" alignItems="center" gap={2} mb={2}>
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
                      <Box flex={1}>
                        <Typography variant="h6" fontWeight="bold">
                          {company.name}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          {company.address}
                        </Typography>
                      </Box>
                      <Chip 
                        label={`${company.totalIndividuals || 0} IDs`}
                        color="primary"
                        size="small"
                        sx={{ fontWeight: 'medium' }}
                      />
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
                        <Typography variant="body2" color="text.secondary" gutterBottom>
                          <BadgeIcon sx={{ fontSize: 16, mr: 1, verticalAlign: 'text-bottom' }} />
                          GOSI: {company.gosiNumber || 'N/A'}
                        </Typography>
                      </Grid>
                      <Grid item xs={6}>
                        <Typography variant="body2" color="text.secondary" gutterBottom>
                          <LocationIcon sx={{ fontSize: 16, mr: 1, verticalAlign: 'text-bottom' }} />
                          Makthab: {company.makthabNumber || 'N/A'}
                        </Typography>
                        <Typography variant="body2" color="text.secondary" gutterBottom>
                          <PersonIcon sx={{ fontSize: 16, mr: 1, verticalAlign: 'text-bottom' }} />
                          Contact: {company.contactPerson || 'N/A'}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          <PhoneIcon sx={{ fontSize: 16, mr: 1, verticalAlign: 'text-bottom' }} />
                          Phone: {company.contactNumber || 'N/A'}
                        </Typography>
                      </Grid>
                    </Grid>

                    {/* Status Cards */}
                    <Box sx={{ mt: 3 }}>
                      <Grid container spacing={1}>
                        <Grid item xs={4}>
                          <Paper 
                            elevation={0}
                            sx={{ 
                              p: 1.5, 
                              bgcolor: 'error.lighter',
                              textAlign: 'center',
                              borderRadius: 2,
                              transition: 'transform 0.2s ease',
                              '&:hover': {
                                transform: 'scale(1.05)'
                              }
                            }}
                          >
                            <Typography variant="h5" color="error.dark" fontWeight="bold">
                              {company.redCards || 0}
                            </Typography>
                            <Typography variant="caption" color="error.dark" fontWeight="medium">
                              Expired
                            </Typography>
                          </Paper>
                        </Grid>
                        <Grid item xs={4}>
                          <Paper 
                            elevation={0}
                            sx={{ 
                              p: 1.5, 
                              bgcolor: 'warning.lighter',
                              textAlign: 'center',
                              borderRadius: 2,
                              transition: 'transform 0.2s ease',
                              '&:hover': {
                                transform: 'scale(1.05)'
                              }
                            }}
                          >
                            <Typography variant="h5" color="warning.dark" fontWeight="bold">
                              {company.orangeCards || 0}
                            </Typography>
                            <Typography variant="caption" color="warning.dark" fontWeight="medium">
                              Warning (≤10 days)
                            </Typography>
                          </Paper>
                        </Grid>
                        <Grid item xs={4}>
                          <Paper 
                            elevation={0}
                            sx={{ 
                              p: 1.5, 
                              bgcolor: 'success.lighter',
                              textAlign: 'center',
                              borderRadius: 2,
                              transition: 'transform 0.2s ease',
                              '&:hover': {
                                transform: 'scale(1.05)'
                              }
                            }}
                          >
                            <Typography variant="h5" color="success.dark" fontWeight="bold">
                              {company.greenCards || 0}
                            </Typography>
                            <Typography variant="caption" color="success.dark" fontWeight="medium">
                              Safe (>20 days)
                            </Typography>
                          </Paper>
                        </Grid>
                      </Grid>
                    </Box>

                    {/* Admin Actions */}
                    {admin && (
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

        {admin && (
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