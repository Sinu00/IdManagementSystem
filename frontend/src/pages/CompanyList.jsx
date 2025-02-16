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
  Avatar
} from '@mui/material';
import {
  Search as SearchIcon,
  Business as BusinessIcon,
  LocationOn as LocationIcon,
  Phone as PhoneIcon,
  ArrowForward as ArrowForwardIcon,
  Sort as SortIcon,
  FilterList as FilterListIcon,
  Person as PersonIcon
} from '@mui/icons-material';
import { companyApi } from '../services/api';
import { useAuth } from '../context/AuthContext';

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
              <Box display="flex" alignItems="center" gap={2}>
                <Avatar 
                  sx={{ 
                    bgcolor: 'primary.main',
                    width: 48,
                    height: 48
                  }}
                >
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
            </Paper>
          </Fade>
        )}

        <Box 
          sx={{ 
            display: 'flex',
            gap: 2,
            mb: 4,
            flexDirection: { xs: 'column', sm: 'row' },
            alignItems: { xs: 'stretch', sm: 'center' }
          }}
        >
          <TextField
            placeholder="Search companies..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            fullWidth
            sx={{ 
              flex: { xs: '1', sm: '1 1 50%' },
              '& .MuiOutlinedInput-root': {
                borderRadius: 2,
                bgcolor: 'background.paper',
                boxShadow: '0 2px 4px rgba(0,0,0,0.05)'
              }
            }}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon color="action" />
                </InputAdornment>
              ),
            }}
          />

          <Box 
            sx={{ 
              display: 'flex',
              gap: 2,
              width: { xs: '100%', sm: 'auto' }
            }}
          >
            <FormControl sx={{ minWidth: { xs: '50%', sm: 150 } }}>
              <InputLabel>Filter</InputLabel>
              <Select
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
                label="Filter"
              >
                <MenuItem value="all">All Companies</MenuItem>
                <MenuItem value="withExpiring">With Expiring IDs</MenuItem>
                <MenuItem value="withExpired">With Expired IDs</MenuItem>
              </Select>
            </FormControl>

            <FormControl sx={{ minWidth: { xs: '50%', sm: 150 } }}>
              <InputLabel>Sort By</InputLabel>
              <Select
                value={sort}
                onChange={(e) => setSort(e.target.value)}
                label="Sort By"
              >
                <MenuItem value="name">Name</MenuItem>
                <MenuItem value="expiringCount">Expiring IDs</MenuItem>
                <MenuItem value="totalIds">Total IDs</MenuItem>
              </Select>
            </FormControl>
          </Box>
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
                    overflow: 'hidden',
                    position: 'relative',
                    height: '100%',
                    '&:hover': {
                      transform: 'translateY(-4px)',
                      boxShadow: theme.shadows[8],
                      '& .arrow-icon': {
                        transform: 'translateX(4px)'
                      }
                    }
                  }}
                >
                  <Box 
                    sx={{ 
                      height: 6, 
                      bgcolor: 'primary.main',
                      width: '100%'
                    }} 
                  />
                  <CardContent sx={{ p: 3 }}>
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
                      <Box>
                        <Typography variant="h6" fontWeight="bold">
                          {company.name}
                        </Typography>
                        <Chip 
                          label={`${company.individuals?.length || 0} IDs`}
                          size="small"
                          sx={{ 
                            bgcolor: 'primary.light',
                            color: 'primary.main',
                            fontWeight: 'medium',
                            mt: 0.5
                          }}
                        />
                      </Box>
                    </Box>

                    <Divider sx={{ my: 2 }} />

                    <Box sx={{ pl: 1 }}>
                      <Box display="flex" alignItems="center" gap={1} mb={1.5}>
                        <LocationIcon fontSize="small" color="action" />
                        <Typography variant="body2" color="text.secondary">
                          {company.address}
                        </Typography>
                      </Box>
                      <Box display="flex" alignItems="center" gap={1}>
                        <PhoneIcon fontSize="small" color="action" />
                        <Typography variant="body2" color="text.secondary">
                          {company.contactNumber}
                        </Typography>
                      </Box>
                    </Box>

                    {(company.hasExpiringIds || company.hasExpiredIds) && (
                      <Box 
                        sx={{ 
                          position: 'absolute',
                          top: 16,
                          right: 16,
                        }}
                      >
                        <Chip
                          label={company.hasExpiredIds ? 'Expired IDs' : 'Expiring IDs'}
                          size="small"
                          sx={{ 
                            bgcolor: company.hasExpiredIds ? 'error.light' : 'warning.light',
                            color: company.hasExpiredIds ? 'error.dark' : 'warning.dark',
                            fontWeight: 'medium'
                          }}
                        />
                      </Box>
                    )}

                    <IconButton 
                      className="arrow-icon"
                      size="small"
                      sx={{ 
                        position: 'absolute',
                        right: 16,
                        bottom: 16,
                        bgcolor: 'primary.main',
                        color: 'white',
                        transition: 'all 0.3s ease',
                        '&:hover': {
                          bgcolor: 'primary.dark'
                        }
                      }}
                    >
                      <ArrowForwardIcon />
                    </IconButton>
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