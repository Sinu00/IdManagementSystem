import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  Container, Typography, Box, Fade, Paper, IconButton, Alert,
  TextField, Badge, Stack, Avatar, LinearProgress, Tooltip,
  Divider, Grid, Chip, Card, CardContent, Dialog, Menu, MenuItem,
  Button, InputAdornment
} from '@mui/material';
import { format } from 'date-fns';
import { individualApi } from '../services/api';
import { 
  Warning as WarningIcon,
  ArrowBack as ArrowBackIcon,
  Business as BusinessIcon,
  Person as PersonIcon,
  CalendarToday as CalendarIcon,
  NotificationsActive as NotificationsActiveIcon,
  ErrorOutline as ErrorIcon,
  AccessTime as AccessTimeIcon,
  Timeline as TimelineIcon,
  Assignment as AssignmentIcon,
  FilterList as FilterListIcon,
  Search as SearchIcon
} from '@mui/icons-material';
import { useAuth } from '../context/AuthContext';
import CustomDialog from '../components/dialogs/CustomDialog';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { styled } from '@mui/material/styles';

const StyledCard = styled(Paper)(({ theme }) => ({
  borderRadius: theme.shape.borderRadius * 2,
  backgroundColor: theme.palette.background.paper,
  transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
  position: 'relative',
  height: '100%',
  cursor: 'pointer',
  overflow: 'hidden',
  [theme.breakpoints.up('sm')]: {
    '&:hover': {
      transform: 'translateY(-8px)',
      boxShadow: '0 12px 24px rgba(0,0,0,0.1)',
    }
  },
  '&::after': {
    content: '""',
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: '4px',
    background: `linear-gradient(90deg, ${theme.palette.error.main}, ${theme.palette.error.light})`,
  }
}));

const formatText = (text) => {
  if (!text) return '';
  return text.charAt(0).toUpperCase() + text.slice(1).toLowerCase();
};

const StatusBadge = styled(Box)(({ theme }) => ({
  position: 'absolute',
  top: theme.spacing(1),
  right: theme.spacing(1),
  padding: '4px 8px',
  borderRadius: 16,
  backgroundColor: theme.palette.error.lighter,
  color: theme.palette.error.main,
  fontSize: '0.7rem',
  fontWeight: 600,
  display: 'flex',
  alignItems: 'center',
  gap: 4,
  boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
  [theme.breakpoints.up('sm')]: {
    top: theme.spacing(2),
    right: theme.spacing(2),
    padding: '4px 12px',
    fontSize: '0.75rem',
  }
}));

function ExpiredIds() {
  const [loading, setLoading] = useState(true);
  const [expiredIds, setExpiredIds] = useState([]);
  const [filteredIds, setFilteredIds] = useState([]);
  const [error, setError] = useState(null);
  const { mainPersonId } = useParams();
  const navigate = useNavigate();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedIndividual, setSelectedIndividual] = useState(null);
  const [newExpiryDate, setNewExpiryDate] = useState(null);
  const [dialogError, setDialogError] = useState('');
  const { admin } = useAuth();
  const { t } = useTranslation();
  
  // Filter state
  const [anchorEl, setAnchorEl] = useState(null);
  const [filterDialogOpen, setFilterDialogOpen] = useState(false);
  const [referredByFilter, setReferredByFilter] = useState('');
  const [referredByOptions, setReferredByOptions] = useState([]);

  useEffect(() => {
    const fetchExpiredIds = async () => {
      try {
        setLoading(true);
        const response = await individualApi.getExpired(mainPersonId);
        setExpiredIds(response.data);
        setFilteredIds(response.data);
        
        // Extract unique referredBy values for filter options
        const uniqueReferredBy = [...new Set(response.data
          .map(individual => individual.referredBy)
          .filter(Boolean))];
        setReferredByOptions(uniqueReferredBy);
      } catch (error) {
        console.error('Error fetching expired IDs:', error);
        setError('Failed to load expired IDs. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    if (mainPersonId) {
      fetchExpiredIds();
    }
  }, [mainPersonId]);

  const handleFilterClick = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleFilterClose = () => {
    setAnchorEl(null);
  };

  const handleFilterByReferredBy = (referredBy) => {
    if (referredBy) {
      const filtered = expiredIds.filter(id => id.referredBy === referredBy);
      setFilteredIds(filtered);
    } else {
      setFilteredIds(expiredIds);
    }
    setReferredByFilter(referredBy);
    handleFilterClose();
  };

  const handleClearFilter = () => {
    setFilteredIds(expiredIds);
    setReferredByFilter('');
    handleFilterClose();
  };

  const handleModify = (individual) => {
    setSelectedIndividual(individual);
    setNewExpiryDate(new Date(individual.expiryDate));
    setDialogOpen(true);
  };

  const handleSave = async () => {
    try {
      await individualApi.update(selectedIndividual._id, {
        expiryDate: newExpiryDate
      });
      
      const response = await individualApi.getExpired(mainPersonId);
      setExpiredIds(response.data);
      
      setDialogOpen(false);
      setDialogError('');
    } catch (error) {
      console.error('Error updating expiry date:', error);
      setDialogError(error.response?.data?.message || 'Failed to update expiry date');
    }
  };

  if (error) return <Alert severity="error">{error}</Alert>;

  return (
    <Box sx={{ bgcolor: '#f8fafc', minHeight: '100vh' }}>
      {/* Header Section - Improved mobile spacing */}
      <Box
        sx={{
          background: 'linear-gradient(135deg, #ff4d4d 0%, #ff8080 100%)',
          color: 'white',
          pt: { xs: 2, sm: 2 }, 
          pb: { xs: 6, sm: 10 }, // Increased padding for desktop to prevent overlap
          px: { xs: 2, sm: 2 },
          position: 'relative',
          overflow: 'visible',
        }}
      >
        <Container maxWidth="lg">
          <Stack 
            direction="row" 
            alignItems="center" 
            spacing={{ xs: 1, sm: 2 }} 
            sx={{ 
              mb: { xs: 2, sm: 2 }
            }}
          >
            <IconButton 
              onClick={() => navigate(-1)} 
              sx={{ 
                color: 'white',
                mr: { xs: 0.5, sm: 1 }
              }}
            >
              <ArrowBackIcon />
            </IconButton>
            <Box sx={{ flex: 1 }}>
              <Typography 
                variant="h4" 
                fontWeight="bold"
                sx={{ 
                  fontSize: { xs: '1.25rem', sm: '2rem', md: '2.125rem' }
                }}
              >
                {t('expiredIds.title')}
              </Typography>
            </Box>
            <Button
              variant="contained"
              color="inherit"
              startIcon={<FilterListIcon />}
              size="small"
              onClick={handleFilterClick}
              sx={{ 
                bgcolor: 'rgba(255,255,255,0.15)', 
                '&:hover': { bgcolor: 'rgba(255,255,255,0.25)' },
                color: 'white',
                px: { xs: 1.5, sm: 2 },
                ml: { xs: 1, sm: 0 }
              }}
            >
              {referredByFilter ? `${referredByFilter}` : t('common.filter')}
            </Button>
            <Menu
              anchorEl={anchorEl}
              open={Boolean(anchorEl)}
              onClose={handleFilterClose}
              sx={{ mt: 1 }}
            >
              <MenuItem onClick={handleClearFilter} disabled={!referredByFilter}>
                <Typography variant="body2">{t('common.showAll')}</Typography>
              </MenuItem>
              <Divider />
              {referredByOptions.map((referredBy, index) => (
                <MenuItem 
                  key={index} 
                  onClick={() => handleFilterByReferredBy(referredBy)}
                  selected={referredByFilter === referredBy}
                >
                  <Typography variant="body2">{referredBy}</Typography>
                </MenuItem>
              ))}
            </Menu>
          </Stack>
          <Typography 
            variant="subtitle1" 
            sx={{ 
              opacity: 0.9, 
              mt: { xs: 1, sm: 0.5 },
              mb: { xs: 0, sm: 0 }, // Added margin bottom for larger screens
              fontSize: { xs: '0.875rem', sm: '1rem' },
              px: { xs: 0.5, sm: 0 }
            }}
          >
            {t('expiredIds.subtitle')}
          </Typography>

          {/* Stats Card - Improved positioning for all screen sizes */}
          <Card
            sx={{
              bgcolor: 'rgba(255,255,255,0.95)',
              backdropFilter: 'blur(20px)',
              borderRadius: { xs: 3, sm: 4 },
              position: 'absolute',
              left: { xs: 16, sm: 24, md: 24 },
              right: { xs: 16, sm: 24, md: 24 },
              bottom: { xs: -50, sm: -70 }, // Lowered position for desktop
              zIndex: 1,
              boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
              mx: 'auto', // Center the card
            }}
          >
            <CardContent sx={{ p: { xs: 2, sm: 3 } }}>
              <Grid container spacing={{ xs: 2, sm: 4 }}>
                <Grid item xs={4} md={4}>
                  <Stack direction="row" spacing={1} alignItems="center">
                    <Avatar sx={{ 
                      bgcolor: 'error.light', 
                      width: { xs: 36, sm: 56 },
                      height: { xs: 36, sm: 56 }
                    }}>
                      <WarningIcon sx={{ fontSize: { xs: 18, sm: 24 } }} />
                    </Avatar>
                    <Box>
                      <Typography 
                        variant="h4" 
                        color="error.main" 
                        fontWeight="bold"
                        sx={{ fontSize: { xs: '1.25rem', sm: '2rem' } }}
                      >
                        {loading ? <LinearProgress color="error" /> : filteredIds.length}
                      </Typography>
                      <Typography 
                        variant="subtitle2" 
                        color="text.secondary"
                        sx={{ 
                          fontSize: { xs: '0.65rem', sm: '0.875rem' },
                          lineHeight: 1.2
                        }}
                      >
                        {t('expiredIds.stats.totalExpired')}
                      </Typography>
                    </Box>
                  </Stack>
                </Grid>
                <Grid item xs={4} md={4}>
                  <Stack direction="row" spacing={1} alignItems="center">
                    <Avatar sx={{ 
                      bgcolor: 'warning.light', 
                      width: { xs: 36, sm: 56 },
                      height: { xs: 36, sm: 56 }
                    }}>
                      <TimelineIcon sx={{ fontSize: { xs: 18, sm: 24 } }} />
                    </Avatar>
                    <Box>
                      <Typography 
                        variant="h4" 
                        color="warning.main" 
                        fontWeight="bold"
                        sx={{ fontSize: { xs: '1.25rem', sm: '2rem' } }}
                      >
                        {loading ? <LinearProgress color="warning" /> : 
                          Math.max(...filteredIds.map(id => 
                            Math.ceil((new Date() - new Date(id.expiryDate)) / (1000 * 60 * 60 * 24))
                          )) || 0}
                      </Typography>
                      <Typography 
                        variant="subtitle2" 
                        color="text.secondary"
                        sx={{ 
                          fontSize: { xs: '0.65rem', sm: '0.875rem' },
                          lineHeight: 1.2
                        }}
                      >
                        {t('expiredIds.stats.maxDaysExpired')}
                      </Typography>
                    </Box>
                  </Stack>
                </Grid>
                <Grid item xs={4} md={4}>
                  <Stack direction="row" spacing={1} alignItems="center">
                    <Avatar sx={{ 
                      bgcolor: 'info.light', 
                      width: { xs: 36, sm: 56 },
                      height: { xs: 36, sm: 56 }
                    }}>
                      <AssignmentIcon sx={{ fontSize: { xs: 18, sm: 24 } }} />
                    </Avatar>
                    <Box>
                      <Typography 
                        variant="h4" 
                        color="info.main" 
                        fontWeight="bold"
                        sx={{ fontSize: { xs: '1.25rem', sm: '2rem' } }}
                      >
                        {loading ? <LinearProgress color="info" /> : 
                          new Set(filteredIds.map(id => id.company._id)).size}
                      </Typography>
                      <Typography 
                        variant="subtitle2" 
                        color="text.secondary"
                        sx={{ 
                          fontSize: { xs: '0.65rem', sm: '0.875rem' },
                          lineHeight: 1.2
                        }}
                      >
                        {t('expiredIds.stats.companiesAffected')}
                      </Typography>
                    </Box>
                  </Stack>
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Container>
      </Box>

      {/* Main Content - Improved spacing for all devices */}
      <Container 
        maxWidth="lg" 
        sx={{ 
          mt: { xs: 8, sm: 10 }, // Increased top margin for desktop to account for new card position
          pb: 6,
          px: { xs: 2, sm: 3 },
          position: 'relative',
          zIndex: 0
        }}
      >
        <Fade in timeout={800}>
          <Grid container spacing={{ xs: 2, sm: 3 }}>
            {loading ? (
              [...Array(6)].map((_, index) => (
                <Grid item xs={12} sm={6} lg={4} key={index}>
                  <StyledCard sx={{ 
                    p: { xs: 2, sm: 3 },
                    mt: { xs: 1, sm: 0 }
                  }}>
                    <LinearProgress color="error" />
                  </StyledCard>
                </Grid>
              ))
            ) : (
              filteredIds.length > 0 ? (
                filteredIds.map((individual) => (
                  <Grid item xs={12} sm={6} lg={4} key={individual._id}>
                    <StyledCard
                      onClick={() => navigate(`/company/${individual.company._id}/individuals`)}
                      sx={{ 
                        '&:hover': {
                          transform: { xs: 'none', sm: 'translateY(-8px)' }
                        },
                        mx: { xs: 0, sm: 0 }, // Removed horizontal margin for mobile
                        mt: { xs: 1, sm: 0 }
                      }}
                    >
                      <Box sx={{ p: { xs: 2.5, sm: 3 } }}>
                        <Stack spacing={2}>
                          <Stack direction="column" spacing={1.5}>
                            <Chip
                              icon={<AccessTimeIcon sx={{ fontSize: 16 }} />}
                              label={`${Math.abs(Math.ceil((new Date(individual.expiryDate) - new Date()) / (1000 * 60 * 60 * 24)))} ${t('expiredIds.status.daysOverdue')}`}
                              color="error"
                              size="small"
                              sx={{ 
                                alignSelf: 'flex-start',
                                fontWeight: 'bold',
                                borderRadius: '12px',
                                height: 24
                              }}
                            />
                            <Stack direction="row" spacing={1.5} alignItems="center">
                              <Avatar
                                sx={{
                                  width: { xs: 40, sm: 60 },
                                  height: { xs: 40, sm: 60 },
                                  bgcolor: 'grey.100',
                                  border: '2px solid',
                                  borderColor: 'error.light'
                                }}
                              >
                                <PersonIcon color="error" sx={{ fontSize: { xs: 20, sm: 24 } }} />
                              </Avatar>
                              <Box>
                                <Typography variant="h6" fontWeight="bold" sx={{ fontSize: '1rem' }}>
                                  {formatText(individual.name)}
                                </Typography>
                                <Chip
                                  size="small"
                                  label={individual.iqamaNumber}
                                  sx={{ mt: 0.5 }}
                                />
                              </Box>
                            </Stack>
                          </Stack>

                          <Divider />

                          <Stack spacing={1.5}>
                            <Stack direction="row" alignItems="center" spacing={1}>
                              <BusinessIcon color="action" sx={{ fontSize: { xs: 18, sm: 24 } }} />
                              <Typography 
                                variant="body1" 
                                color="text.primary"
                                sx={{ fontSize: { xs: '0.8rem', sm: '1rem' } }}
                              >
                                {individual.company.name}
                              </Typography>
                            </Stack>
                            <Stack direction="row" alignItems="center" spacing={1}>
                              <PersonIcon color="action" sx={{ fontSize: { xs: 18, sm: 24 } }} />
                              <Typography 
                                variant="body1" 
                                color="text.primary"
                                sx={{ fontSize: { xs: '0.8rem', sm: '1rem' } }}
                              >
                                {t('expiredIds.cardInfo.referredBy')}: {individual.referredBy || t('common.na')}
                              </Typography>
                            </Stack>
                            <Stack direction="row" alignItems="center" spacing={1}>
                              <CalendarIcon color="error" sx={{ fontSize: { xs: 18, sm: 24 } }} />
                              <Typography 
                                variant="body1" 
                                color="error.main" 
                                fontWeight="medium"
                                sx={{ fontSize: { xs: '0.8rem', sm: '1rem' } }}
                              >
                                {t('expiredIds.cardInfo.expiresOn')} {format(new Date(individual.expiryDate), 'dd MMM yyyy')}
                              </Typography>
                            </Stack>
                          </Stack>
                        </Stack>
                      </Box>
                    </StyledCard>
                  </Grid>
                ))
              ) : (
                <Grid item xs={12} sx={{ mt: 3 }}>
                  <Paper 
                    sx={{ 
                      p: { xs: 3, sm: 4 }, 
                      textAlign: 'center',
                      borderRadius: 2,
                      bgcolor: 'background.paper'
                    }}
                  >
                    <Box display="flex" flexDirection="column" alignItems="center" gap={2}>
                      <PersonIcon sx={{ fontSize: 64, color: 'text.disabled' }} />
                      <Typography color="textSecondary" variant="h6">
                        {referredByFilter 
                          ? t('expiredIds.noResults.withFilter', { filter: referredByFilter }) 
                          : t('expiredIds.noResults.title')}
                      </Typography>
                      <Typography color="textSecondary" variant="body2">
                        {referredByFilter 
                          ? t('expiredIds.noResults.tryOtherFilter')
                          : t('expiredIds.noResults.subtitle')}
                      </Typography>
                      {referredByFilter && (
                        <Button 
                          variant="outlined" 
                          size="small" 
                          onClick={handleClearFilter}
                          startIcon={<FilterListIcon />}
                        >
                          {t('common.clearFilter')}
                        </Button>
                      )}
                    </Box>
                  </Paper>
                </Grid>
              )
            )}
          </Grid>
        </Fade>

        {/* Update Dialog with same responsive styling */}
        <Dialog 
          open={dialogOpen} 
          onClose={() => setDialogOpen(false)}
          fullWidth
          maxWidth="sm"
          sx={{
            '& .MuiDialog-paper': {
              margin: { xs: 2, sm: 4 },
              width: { xs: 'calc(100% - 32px)', sm: '600px' }
            }
          }}
        >
          <CustomDialog
            title={t('expiredIds.modifyExpiry.title')}
            onSubmit={handleSave}
            error={dialogError}
          >
            <Box sx={{ mt: 1 }}>
              <LocalizationProvider dateAdapter={AdapterDateFns}>
                <DatePicker
                  label={t('expiredIds.modifyExpiry.newDate')}
                  value={newExpiryDate}
                  onChange={(newValue) => setNewExpiryDate(newValue)}
                  renderInput={(params) => (
                    <TextField 
                      {...params} 
                      fullWidth
                      variant="outlined"
                    />
                  )}
                />
              </LocalizationProvider>
              <Typography 
                variant="body2" 
                sx={{ 
                  mt: 3,
                  color: 'text.secondary',
                  bgcolor: 'grey.50',
                  p: 2,
                  borderRadius: 2,
                  border: '1px solid',
                  borderColor: 'grey.200'
                }}
              >
                {t('expiredIds.modifyExpiry.updating')} <b>{selectedIndividual?.name}</b>
              </Typography>
            </Box>
          </CustomDialog>
        </Dialog>
      </Container>
    </Box>
  );
}

export default ExpiredIds; 