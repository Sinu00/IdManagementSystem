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
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Fab,
  Alert,
  Button,
  Card,
  CardContent,
  Divider,
} from '@mui/material';
import {
  Search as SearchIcon,
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Business as BusinessIcon,
  Sort as SortIcon,
  Login as LoginIcon,
  Person as PersonIcon,
  Badge as BadgeIcon,
  CalendarToday as CalendarIcon,
  Autorenew as RenewIcon,
  LocationOn as LocationIcon,
  Phone as PhoneIcon,
  MonetizationOn as MonetizationIcon,
  PictureAsPdf as PdfIcon,
} from '@mui/icons-material';
import { individualApi, companyApi } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { format } from 'date-fns';
import LoadingScreen from '../components/common/LoadingScreen';
import IndividualDialog from '../components/dialogs/IndividualDialog';
import ConfirmDialog from '../components/dialogs/ConfirmDialog';
import ProfileMenu from '../components/ProfileMenu';

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
  const { admin, logout, username } = useAuth();
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

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [companyResponse, individualsResponse] = await Promise.all([
          companyApi.get(companyId),
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
    setDialogOpen(true);
  };

  const handleRenew = (individual) => {
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
            await individualApi.create({ ...formData, company: companyId });
          } else if (dialogMode === 'edit') {
            await individualApi.update(selectedIndividual._id, formData);
          } else {
            await individualApi.update(selectedIndividual._id, { 
              expiryDate: formData.expiryDate,
              amount: formData.amount
            });
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
      setConfirmDialogOpen(true);
    } catch (error) {
      console.error('Error in handleSubmit:', error);
      setDialogError(error.message || 'An error occurred');
    }
  };

  const handleLogout = () => {
    logout();
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

  if (loading) return <LoadingScreen />;
  if (error) return <Alert severity="error">{error}</Alert>;

  return (
    <Box sx={{ width: '100%', minHeight: '100vh', bgcolor: 'background.default', pt: 4, pb: 6 }}>
      <Container maxWidth="lg">
        {company && (
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
              <Box display="flex" alignItems="flex-start" justifyContent="space-between">
                <Box display="flex" alignItems="center" gap={2}>
                  <Avatar sx={{ bgcolor: 'primary.main', width: 48, height: 48 }}>
                    <BusinessIcon />
                  </Avatar>
                  <Box>
                    <Typography variant="h6" fontWeight="bold">
                      {company.name}
                    </Typography>
                    <Typography variant="body2">
                      Managing {filteredData.length} Individuals
                    </Typography>
                  </Box>
                </Box>

                <Box 
                  sx={{ 
                    display: 'flex', 
                    gap: 4,
                    alignItems: 'center'
                  }}
                >
                  <Box>
                    <Grid container spacing={2} sx={{ width: 'auto', minWidth: '400px' }}>
                      <Grid item xs={6}>
                        <Typography variant="body2" color="primary.dark" gutterBottom>
                          <BusinessIcon sx={{ fontSize: 16, mr: 1, verticalAlign: 'text-bottom' }} />
                          CR: {company.crNumber || 'N/A'}
                        </Typography>
                        <Typography variant="body2" color="primary.dark" gutterBottom>
                          <BadgeIcon sx={{ fontSize: 16, mr: 1, verticalAlign: 'text-bottom' }} />
                          GOSI: {company.gosiNumber || 'N/A'}
                        </Typography>
                      </Grid>
                      <Grid item xs={6}>
                        <Typography variant="body2" color="primary.dark" gutterBottom>
                          <PersonIcon sx={{ fontSize: 16, mr: 1, verticalAlign: 'text-bottom' }} />
                          Sponsor: {company.sponserId || 'N/A'}
                        </Typography>
                        <Typography variant="body2" color="primary.dark" gutterBottom>
                          <LocationIcon sx={{ fontSize: 16, mr: 1, verticalAlign: 'text-bottom' }} />
                          Maktab: {company.makthabNumber || 'N/A'}
                        </Typography>
                      </Grid>
                    </Grid>
                  </Box>


                    <IconButton
  onClick={() => window.print()}
  sx={{
    bgcolor: 'secondary.main',
    color: 'white',
    '&:hover': {
      bgcolor: 'secondary.dark',
      transform: 'translateY(-2px)',
      boxShadow: theme => theme.shadows[4]
    }
  }}
>
  <PdfIcon />
</IconButton>
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
          
          <FormControl sx={{ minWidth: 150 }}>
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

          <FormControl sx={{ minWidth: 150 }}>
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
                        '&:hover': {
                          transform: 'translateY(-4px)',
                          boxShadow: theme.shadows[8]
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
                                  format(new Date(individual.expiryDate), 'dd/MM/yyyy') : 
                                  'N/A'}
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
                              <MonetizationIcon sx={{ fontSize: 16, color: 'primary.main' }} />
                              <Typography variant="body2" color="text.secondary">
                                Amount: {individual.amount ? `SAR ${individual.amount}` : 'N/A'}
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
                        </Grid>

                        {admin && (
                          <Box 
                            sx={{ 
                              display: 'flex', 
                              justifyContent: 'flex-end',
                              mt: 2,
                              gap: 1
                            }}
                          >
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
                          </Box>
                        )}
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
        </Fade>

        {admin && (
          <Fab
            color="primary"
            onClick={handleAdd}
            sx={{ 
              position: 'fixed', 
              bottom: 24, 
              right: 24,
              transition: 'all 0.2s ease',
              '&:hover': {
                transform: 'scale(1.1) rotate(90deg)'
              }
            }}
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
      />

      <ConfirmDialog
        open={confirmDialogOpen}
        onClose={() => setConfirmDialogOpen(false)}
        onConfirm={confirmAction}
        title="Confirm Action"
        message={confirmMessage}
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