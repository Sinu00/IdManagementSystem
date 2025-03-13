import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  Container, Typography, Box, Fade, Paper, IconButton, Alert,
  TextField, Stack, Avatar, LinearProgress, Tooltip,
  Divider, Grid, Chip, Card, CardContent, Button, Menu, MenuItem
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
  AccessTime as AccessTimeIcon,
  Timeline as TimelineIcon,
  Assignment as AssignmentIcon,
  HourglassEmpty as HourglassIcon,
  FilterList as FilterListIcon
} from '@mui/icons-material';
import { useAuth } from '../context/AuthContext';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { styled } from '@mui/material/styles';

const StyledCard = styled(Paper)(({ theme }) => ({
  borderRadius: theme.shape.borderRadius * 3,
  backgroundColor: theme.palette.background.paper,
  transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
  position: 'relative',
  height: '100%',
  cursor: 'pointer',
  overflow: 'hidden',
  '&:hover': {
    transform: 'translateY(-8px)',
    boxShadow: '0 12px 24px rgba(0,0,0,0.1)',
    '& .hover-reveal': {
      opacity: 1,
      transform: 'translateY(0)',
    }
  },
  '&::after': {
    content: '""',
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: '4px',
    background: `linear-gradient(90deg, ${theme.palette.warning.main}, ${theme.palette.warning.light})`,
  }
}));

const StatusBadge = styled(Box)(({ theme }) => ({
  position: 'absolute',
  top: 16,
  right: 16,
  padding: '4px 12px',
  borderRadius: 20,
  backgroundColor: theme.palette.warning.lighter,
  color: theme.palette.warning.main,
  fontSize: '0.75rem',
  fontWeight: 600,
  display: 'flex',
  alignItems: 'center',
  gap: 4,
  boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
}));

const formatText = (text) => {
  if (!text) return '';
  return text.charAt(0).toUpperCase() + text.slice(1).toLowerCase();
};

function ExpiringSoonIds() {
  const [loading, setLoading] = useState(true);
  const [expiringIds, setExpiringIds] = useState([]);
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
  const [referredByFilter, setReferredByFilter] = useState('');
  const [referredByOptions, setReferredByOptions] = useState([]);

  useEffect(() => {
    const fetchExpiringIds = async () => {
      try {
        setLoading(true);
        const response = await individualApi.getExpiringSoon(mainPersonId, 30);
        setExpiringIds(response.data);
        setFilteredIds(response.data);
        
        // Extract unique referredBy values for filter options
        const uniqueReferredBy = [...new Set(response.data
          .map(individual => individual.referredBy)
          .filter(Boolean))];
        setReferredByOptions(uniqueReferredBy);
      } catch (error) {
        console.error('Error fetching expiring IDs:', error);
        setError('Failed to load expiring IDs. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    if (mainPersonId) {
      fetchExpiringIds();
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
      const filtered = expiringIds.filter(id => id.referredBy === referredBy);
      setFilteredIds(filtered);
    } else {
      setFilteredIds(expiringIds);
    }
    setReferredByFilter(referredBy);
    handleFilterClose();
  };

  const handleClearFilter = () => {
    setFilteredIds(expiringIds);
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
      
      // Refresh the list
      const response = await individualApi.getExpiringSoon(mainPersonId, 30);
      setExpiringIds(response.data);
      
      setDialogOpen(false);
      setDialogError('');
    } catch (error) {
      console.error('Error updating expiry date:', error);
      setDialogError(error.response?.data?.message || 'Failed to update expiry date');
    }
  };

  if (error) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Paper elevation={0} sx={{ p: 3, bgcolor: 'warning.lighter', borderRadius: 3 }}>
          <Typography color="warning.main">{error}</Typography>
          <Button onClick={() => window.location.reload()} sx={{ mt: 2 }}>
            {t('common.tryAgain')}
          </Button>
        </Paper>
      </Container>
    );
  }

  return (
    <Box sx={{ bgcolor: '#f8fafc', minHeight: '100vh' }}>
      {/* Header Section - Improved mobile spacing */}
      <Box
        sx={{
          background: 'linear-gradient(135deg, #ff9800 0%, #ffd54f 100%)',
          color: 'white',
          pt: { xs: 2, sm: 2 }, // Increased top padding for mobile
          pb: { xs: 10, sm: 10 }, // Increased bottom padding for mobile
          px: { xs: 2, sm: 2 }, // Added horizontal padding for mobile
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
              mb: { xs: 2, sm: 2 },
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
                {t('expiringSoonIds.title')}
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
              mb: { xs: 2, sm: 1 },
              fontSize: { xs: '0.875rem', sm: '1rem' },
              px: { xs: 0.5, sm: 0 }
            }}
          >
            {t('expiringSoonIds.subtitle')}
          </Typography>

          {/* Stats Card - Improved mobile positioning */}
          <Card
            sx={{
              bgcolor: 'rgba(255,255,255,0.95)',
              backdropFilter: 'blur(20px)',
              borderRadius: { xs: 3, sm: 4 },
              position: 'absolute',
              left: { xs: 16, sm: 24, md: 24 },
              right: { xs: 16, sm: 24, md: 24 },
              bottom: { xs: -90, sm: -60 }, // Adjusted for mobile
              zIndex: 1,
              boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
              mx: 'auto', // Center the card
            }}
          >
            <CardContent sx={{ p: { xs: 2.5, sm: 3 } }}>
              <Grid container spacing={{ xs: 3, sm: 4 }}>
                <Grid item xs={4} md={4}>
                  <Stack direction="row" spacing={1} alignItems="center">
                    <Avatar sx={{ 
                      bgcolor: 'warning.light', 
                      width: { xs: 36, sm: 56 },
                      height: { xs: 36, sm: 56 }
                    }}>
                      <HourglassIcon sx={{ fontSize: { xs: 18, sm: 24 } }} />
                    </Avatar>
                    <Box>
                      <Typography 
                        variant="h4" 
                        color="warning.main" 
                        fontWeight="bold"
                        sx={{ fontSize: { xs: '1.25rem', sm: '2rem' } }}
                      >
                        {loading ? <LinearProgress color="warning" /> : filteredIds.length}
                      </Typography>
                      <Typography 
                        variant="subtitle2" 
                        color="text.secondary"
                        sx={{ 
                          fontSize: { xs: '0.65rem', sm: '0.875rem' },
                          lineHeight: 1.2
                        }}
                      >
                        {t('expiringSoonIds.stats.totalExpiring')}
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
                          Math.min(...filteredIds.map(id => id.daysUntilExpiry)) || 0}
                      </Typography>
                      <Typography 
                        variant="subtitle2" 
                        color="text.secondary"
                        sx={{ 
                          fontSize: { xs: '0.65rem', sm: '0.875rem' },
                          lineHeight: 1.2
                        }}
                      >
                        {t('expiringSoonIds.stats.daysUntilNext')}
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
                      <AssignmentIcon sx={{ fontSize: { xs: 18, sm: 24 } }} />
                    </Avatar>
                    <Box>
                      <Typography 
                        variant="h4" 
                        color="warning.main" 
                        fontWeight="bold"
                        sx={{ fontSize: { xs: '1.25rem', sm: '2rem' } }}
                      >
                        {loading ? <LinearProgress color="warning" /> : 
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
                        {t('expiringSoonIds.stats.companiesAffected')}
                      </Typography>
                    </Box>
                  </Stack>
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Container>
      </Box>

      {/* Main Content - Improved mobile spacing */}
      <Container 
        maxWidth="lg" 
        sx={{ 
          mt: { xs: 14, sm: 12 }, // Increased top margin for mobile
          pb: 6,
          px: { xs: 2, sm: 3 }, // Added consistent padding
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
                    <LinearProgress color="warning" />
                  </StyledCard>
                </Grid>
              ))
            ) : filteredIds.length > 0 ? (
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
                            label={`${individual.daysUntilExpiry} ${t('expiringSoonIds.status.daysUntilExpiry')}`}
                            color="warning"
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
                                borderColor: 'warning.light'
                              }}
                            >
                              <PersonIcon color="warning" sx={{ fontSize: { xs: 20, sm: 24 } }} />
                            </Avatar>
                            <Box>
                              <Typography 
                                variant="h6" 
                                fontWeight="bold"
                                sx={{ fontSize: '1rem' }}
                              >
                                {formatText(individual.name)}
                              </Typography>
                              <Chip
                                size="small"
                                label={individual.iqamaNumber}
                                sx={{ 
                                  mt: 0.5,
                                  height: { xs: 20, sm: 24 },
                                  '& .MuiChip-label': {
                                    fontSize: { xs: '0.7rem', sm: '0.75rem' }
                                  }
                                }}
                              />
                            </Box>
                          </Stack>
                        </Stack>

                        <Divider />

                        <Stack spacing={1.5}>
                          <Stack direction="row" alignItems="center" spacing={1}>
                            <BusinessIcon sx={{ fontSize: { xs: 18, sm: 24 } }} color="action" />
                            <Typography 
                              variant="body1" 
                              color="text.primary"
                              sx={{ fontSize: { xs: '0.8rem', sm: '1rem' } }}
                            >
                              {individual.company.name}
                            </Typography>
                          </Stack>
                          <Stack direction="row" alignItems="center" spacing={1}>
                            <PersonIcon sx={{ fontSize: { xs: 18, sm: 24 } }} color="action" />
                            <Typography 
                              variant="body1" 
                              color="text.primary"
                              sx={{ fontSize: { xs: '0.8rem', sm: '1rem' } }}
                            >
                              {t('expiringSoonIds.cardInfo.referredBy')}: {individual.referredBy || t('common.na')}
                            </Typography>
                          </Stack>
                          <Stack direction="row" alignItems="center" spacing={1}>
                            <CalendarIcon sx={{ fontSize: { xs: 18, sm: 24 } }} color="warning" />
                            <Typography 
                              variant="body1" 
                              color="warning.main" 
                              fontWeight="medium"
                              sx={{ fontSize: { xs: '0.8rem', sm: '1rem' } }}
                            >
                              {t('expiringSoonIds.cardInfo.expiresOn')} {format(new Date(individual.expiryDate), 'dd MMM yyyy')}
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
                        ? t('expiringSoonIds.noResults.withFilter', { filter: referredByFilter }) 
                        : t('expiringSoonIds.noResults.title')}
                    </Typography>
                    <Typography color="textSecondary" variant="body2">
                      {referredByFilter 
                        ? t('expiringSoonIds.noResults.tryOtherFilter')
                        : t('expiringSoonIds.noResults.subtitle')}
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
            )}
          </Grid>
        </Fade>

        {/* Dialog */}
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
          <DialogTitle sx={{ fontSize: { xs: '1.25rem', sm: '1.5rem' } }}>
            {t('expiringSoonIds.modifyExpiry.title')}
          </DialogTitle>
          <DialogContent sx={{ p: { xs: 2, sm: 3 } }}>
            <Box sx={{ mt: 2 }}>
              {dialogError && (
                <Alert severity="error" sx={{ mb: 2 }}>
                  {dialogError}
                </Alert>
              )}
              <LocalizationProvider dateAdapter={AdapterDateFns}>
                <DatePicker
                  label={t('expiringSoonIds.modifyExpiry.newDate')}
                  value={newExpiryDate}
                  onChange={(newValue) => setNewExpiryDate(newValue)}
                  renderInput={(params) => <TextField {...params} fullWidth />}
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
                {t('expiringSoonIds.modifyExpiry.updating')} <b>{selectedIndividual?.name}</b>
              </Typography>
            </Box>
          </DialogContent>
          <DialogActions sx={{ p: { xs: 2, sm: 3 } }}>
            <Button onClick={() => setDialogOpen(false)}>{t('common.cancel')}</Button>
            <Button onClick={handleSave} variant="contained" color="primary">
              {t('common.save')}
            </Button>
          </DialogActions>
        </Dialog>
      </Container>
    </Box>
  );
}

export default ExpiringSoonIds; 