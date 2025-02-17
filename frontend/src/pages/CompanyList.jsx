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
  Button
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
  Badge as BadgeIcon
} from '@mui/icons-material';
import { companyApi } from '../services/api';
import { useAuth } from '../context/AuthContext';
import ProfileMenu from '../components/ProfileMenu';

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
  const { admin, logout } = useAuth();
  const [username, setUsername] = useState('');

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

  useEffect(() => {
    const token = localStorage.getItem('adminToken');
    if (token) {
      try {
        const decoded = JSON.parse(atob(token.split('.')[1]));
        setUsername(decoded.username);
      } catch (error) {
        console.error('Error decoding token:', error);
        setUsername('');
      }
    }
  }, []);

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
    setUsername('');
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
              <Box display="flex" alignItems="center" justifyContent="space-between">
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
                  </Box>
                </Box>
                
                {admin && (
                  <ProfileMenu 
                    username={username} 
                    onLogout={handleLogout}
                  />
                )}
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
                    cursor: 'pointer',
                    transition: 'all 0.3s ease-in-out',
                    borderRadius: 3,
                    height: '100%',
                    position: 'relative',
                    '&:hover': {
                      transform: 'translateY(-4px)',
                      boxShadow: theme.shadows[8],
                      '& .arrow-icon': {
                        opacity: 1,
                        transform: 'translateX(0)'
                      }
                    }
                  }}
                >
                  <Box sx={{ height: 6, bgcolor: 'primary.main', width: '100%' }} />
                  <CardContent sx={{ p: 3 }}>
                    <Box display="flex" alignItems="center" justifyContent="space-between" mb={2}>
                      <Box display="flex" alignItems="center" gap={2}>
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
                        <Box>
                          <Typography variant="h6" fontWeight="bold">
                            {company.name}
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            {company.individuals?.length || 0} Total IDs
                          </Typography>
                        </Box>
                      </Box>
                      <IconButton 
                        className="arrow-icon"
                        size="small"
                        sx={{ 
                          bgcolor: 'primary.main',
                          color: 'white',
                          transition: 'all 0.3s ease',
                          opacity: 0,
                          transform: 'translateX(-10px)',
                          '&:hover': {
                            bgcolor: 'primary.dark'
                          }
                        }}
                      >
                        <ArrowForwardIcon />
                      </IconButton>
                    </Box>

                    <Divider sx={{ my: 2 }} />

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
                        <Typography variant="body2" color="text.secondary">
                          <LocationIcon sx={{ fontSize: 16, mr: 1, verticalAlign: 'text-bottom' }} />
                          Makthab: {company.makthabNumber || 'N/A'}
                        </Typography>
                      </Grid>
                    </Grid>

                    <Box sx={{ mt: 3 }}>
                      <Grid container spacing={1}>
                        <Grid item xs={4}>
                          <Paper 
                            elevation={0} 
                            sx={{ 
                              p: 1.5, 
                              bgcolor: 'error.light',
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
                              bgcolor: 'warning.light',
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
                              Expiring
                            </Typography>
                          </Paper>
                        </Grid>
                        <Grid item xs={4}>
                          <Paper 
                            elevation={0} 
                            sx={{ 
                              p: 1.5, 
                              bgcolor: 'success.light',
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
                              Valid
                            </Typography>
                          </Paper>
                        </Grid>
                      </Grid>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        </Fade>
      </Container>
    </Box>
  );
}

export default CompanyList; 