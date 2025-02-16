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
  Divider,
  useTheme
} from '@mui/material';
import {
  Search as SearchIcon,
  Business as BusinessIcon,
  LocationOn as LocationIcon,
  Phone as PhoneIcon,
  ArrowForward as ArrowForwardIcon,
  Login as LoginIcon
} from '@mui/icons-material';
import { companyApi } from '../services/api';
import { useAuth } from '../context/AuthContext';

function CompanyList() {
  const [companies, setCompanies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const { id: mainPersonId } = useParams();
  const navigate = useNavigate();
  const theme = useTheme();

  useEffect(() => {
    const fetchCompanies = async () => {
      try {
        setLoading(true);
        const response = await companyApi.getByMainPerson(mainPersonId);
        setCompanies(response.data);
      } catch (error) {
        console.error('Error fetching companies:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchCompanies();
  }, [mainPersonId]);

  const filteredCompanies = companies.filter(company =>
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
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        bgcolor: 'background.default',
        py: 6
      }}
    >
      <Container maxWidth="lg">
        <Fade in timeout={800}>
          <Box 
            sx={{ 
              display: 'flex',
              alignItems: 'center',
              gap: 2,
              mb: 6,
              width: '100%',
              maxWidth: 600,
              mx: 'auto'
            }}
          >
            <TextField
              placeholder="Search companies..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              fullWidth
              sx={{ 
                '& .MuiOutlinedInput-root': {
                  borderRadius: 3,
                  bgcolor: 'background.paper',
                  boxShadow: theme.shadows[2],
                  '&:hover': {
                    boxShadow: theme.shadows[4]
                  }
                }
              }}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon color="action" />
                  </InputAdornment>
                )
              }}
            />
            <IconButton 
              onClick={() => navigate('/admin/login')}
              sx={{ 
                bgcolor: 'primary.main',
                color: 'white',
                boxShadow: theme.shadows[2],
                '&:hover': {
                  bgcolor: 'primary.dark',
                  boxShadow: theme.shadows[4]
                }
              }}
            >
              <LoginIcon />
            </IconButton>
          </Box>
        </Fade>

        <Fade in timeout={1000}>
          <Grid container spacing={3}>
            {filteredCompanies.map((company) => (
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
                    bgcolor: 'background.paper',
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
                      height: 8, 
                      bgcolor: 'primary.main',
                      width: '100%'
                    }} 
                  />
                  <CardContent sx={{ p: 3 }}>
                    <Box display="flex" alignItems="center" gap={2} mb={2}>
                      <BusinessIcon color="primary" fontSize="large" />
                      <Box>
                        <Typography variant="h6" fontWeight="bold">
                          {company.name}
                        </Typography>
                        <Chip 
                          label={`${company.individuals?.length || 0} Individuals`}
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
                      <Box display="flex" alignItems="center" gap={1} mb={1}>
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