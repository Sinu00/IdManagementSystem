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
  Alert
} from '@mui/material';
import {
  Search as SearchIcon,
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Business as BusinessIcon,
  Sort as SortIcon
} from '@mui/icons-material';
import { individualApi, companyApi } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { format } from 'date-fns';
import LoadingScreen from '../components/common/LoadingScreen';
import IndividualDialog from '../components/dialogs/IndividualDialog';
import ConfirmDialog from '../components/dialogs/ConfirmDialog';

function IndividualList() {
  const { id: companyId } = useParams();
  const [allIndividuals, setAllIndividuals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [company, setCompany] = useState(null);
  const { admin } = useAuth();
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('all');
  const [sort, setSort] = useState('name');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedIndividual, setSelectedIndividual] = useState(null);
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);
  const [individualToDelete, setIndividualToDelete] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [companyResponse, individualsResponse] = await Promise.all([
          companyApi.getById(companyId),
          individualApi.getByCompany(companyId)
        ]);
        
        setCompany(companyResponse.data);
        setAllIndividuals(individualsResponse.data);
      } catch (error) {
        console.error('Error fetching data:', error);
        setError(error.message);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [companyId]);

  const filteredData = useMemo(() => {
    return allIndividuals
      .filter(individual => {
        const matchesSearch = !search || 
          individual.name?.toLowerCase().includes(search.toLowerCase()) ||
          individual.iqamaNumber?.toLowerCase().includes(search.toLowerCase());

        const matchesFilter = filter === 'all' || 
          (filter === 'active' && calculateStatus(individual.expiryDate) === 'Active') ||
          (filter === 'expiring' && ['Warning', 'Critical'].includes(calculateStatus(individual.expiryDate))) ||
          (filter === 'expired' && calculateStatus(individual.expiryDate) === 'Expired');

        return matchesSearch && matchesFilter;
      })
      .sort((a, b) => {
        switch (sort) {
          case 'name':
            return a.name?.localeCompare(b.name);
          case 'expiryDate':
            return new Date(a.expiryDate) - new Date(b.expiryDate);
          default:
            return 0;
        }
      });
  }, [allIndividuals, search, filter, sort]);

  const calculateStatus = (expiryDate) => {
    if (!expiryDate) return 'Unknown';
    const today = new Date();
    const expiry = new Date(expiryDate);
    const daysUntilExpiry = Math.ceil((expiry - today) / (1000 * 60 * 60 * 24));

    if (daysUntilExpiry < 0) return 'Expired';
    if (daysUntilExpiry <= 5) return 'Critical';
    if (daysUntilExpiry <= 10) return 'Warning';
    return 'Active';
  };

  const handleAdd = () => {
    setSelectedIndividual(null);
    setDialogOpen(true);
  };

  const handleEdit = (individual) => {
    setSelectedIndividual(individual);
    setDialogOpen(true);
  };

  const handleDelete = (individual) => {
    setIndividualToDelete(individual);
    setConfirmDialogOpen(true);
  };

  const handleSubmit = async (formData) => {
    try {
      if (selectedIndividual) {
        await individualApi.update(selectedIndividual._id, { ...formData, company: companyId });
      } else {
        await individualApi.create({ ...formData, company: companyId });
      }
      // Refresh the list
      const response = await individualApi.getByCompany(companyId);
      setAllIndividuals(response.data);
      setDialogOpen(false);
    } catch (error) {
      console.error('Error saving individual:', error);
    }
  };

  const handleConfirmDelete = async () => {
    try {
      await individualApi.delete(individualToDelete._id);
      // Refresh the list
      const response = await individualApi.getByCompany(companyId);
      setAllIndividuals(response.data);
      setConfirmDialogOpen(false);
    } catch (error) {
      console.error('Error deleting individual:', error);
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
            </Paper>
          </Fade>
        )}

        <Box sx={{ display: 'flex', gap: 2, mb: 4, flexDirection: { xs: 'column', sm: 'row' } }}>
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
            sx={{ flex: 1 }}
          />
          
          <FormControl sx={{ minWidth: 120 }}>
            <InputLabel>Status</InputLabel>
            <Select
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              label="Status"
              startAdornment={<SortIcon color="action" sx={{ mr: 1 }} />}
            >
              <MenuItem value="all">All Status</MenuItem>
              <MenuItem value="active">Active</MenuItem>
              <MenuItem value="expiring">Expiring Soon</MenuItem>
              <MenuItem value="expired">Expired</MenuItem>
            </Select>
          </FormControl>

          <FormControl sx={{ minWidth: 120 }}>
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
          <TableContainer component={Paper} sx={{ borderRadius: 2 }}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Name</TableCell>
                  <TableCell>Iqama Number</TableCell>
                  <TableCell>Nationality</TableCell>
                  <TableCell>Expiry Date</TableCell>
                  <TableCell align="center">Status</TableCell>
                  {admin && <TableCell align="center">Actions</TableCell>}
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredData.length > 0 ? (
                  filteredData.map((individual) => {
                    const status = calculateStatus(individual.expiryDate);
                    return (
                      <TableRow 
                        key={individual._id}
                        sx={{ 
                          '&:hover': {
                            bgcolor: 'action.hover',
                          }
                        }}
                      >
                        <TableCell>{individual.name}</TableCell>
                        <TableCell>{individual.iqamaNumber}</TableCell>
                        <TableCell>{individual.nationality}</TableCell>
                        <TableCell>
                          {individual.expiryDate ? 
                            format(new Date(individual.expiryDate), 'dd/MM/yyyy') : 
                            'N/A'}
                        </TableCell>
                        <TableCell align="center">
                          <Chip 
                            label={status}
                            color={
                              status === 'Active' ? 'success' :
                              status === 'Expired' ? 'error' :
                              'warning'
                            }
                            size="small"
                          />
                        </TableCell>
                        {admin && (
                          <TableCell align="center">
                            <IconButton 
                              size="small" 
                              color="primary"
                              onClick={() => handleEdit(individual)}
                            >
                              <EditIcon />
                            </IconButton>
                            <IconButton 
                              size="small" 
                              color="error"
                              onClick={() => handleDelete(individual)}
                            >
                              <DeleteIcon />
                            </IconButton>
                          </TableCell>
                        )}
                      </TableRow>
                    );
                  })
                ) : (
                  <TableRow>
                    <TableCell colSpan={6} align="center">
                      <Typography color="textSecondary">
                        No individuals found
                      </Typography>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </Fade>

        {admin && (
          <Fab
            color="primary"
            onClick={handleAdd}
            sx={{ 
              position: 'fixed', 
              bottom: 24, 
              right: 24,
              transition: 'transform 0.2s',
              '&:hover': {
                transform: 'scale(1.1)'
              }
            }}
          >
            <AddIcon />
          </Fab>
        )}
      </Container>
    </Box>
  );
}

export default IndividualList; 