import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box,
  TextField,
  IconButton,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Pagination,
  InputAdornment,
  CircularProgress,
  Container,
  Fade,
  Chip,
  Typography,
  useTheme,
  Fab,
  Divider
} from '@mui/material';
import {
  Search as SearchIcon,
  Add as AddIcon,
  FilterList as FilterListIcon,
  Sort as SortIcon,
} from '@mui/icons-material';
import { individualApi, companyApi } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { format, isBefore, addDays } from 'date-fns';
import IndividualDialog from '../components/dialogs/IndividualDialog';
import ConfirmDialog from '../components/dialogs/ConfirmDialog';

function IndividualList() {
  const { id: companyId } = useParams();
  const [individuals, setIndividuals] = useState([]);
  const [company, setCompany] = useState(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('all');
  const [sort, setSort] = useState('name');
  const [page, setPage] = useState(1);
  const { admin } = useAuth();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedIndividual, setSelectedIndividual] = useState(null);
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);
  const [individualToDelete, setIndividualToDelete] = useState(null);
  const navigate = useNavigate();
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        console.log('Fetching individuals for company:', companyId);
        const [individualsRes, companyRes] = await Promise.all([
          individualApi.getByCompany(companyId, search, sort, filter),
          companyApi.get(companyId)
        ]);
        console.log('Received individuals:', individualsRes.data);
        console.log('Received company:', companyRes.data);
        setIndividuals(individualsRes.data);
        setCompany(companyRes.data);
      } catch (error) {
        console.error('Error fetching data:', error);
        setError('Failed to load data');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [companyId, search, sort, filter]);

  const getExpiryStatus = (expiryDate) => {
    const today = new Date();
    const expiry = new Date(expiryDate);
    
    if (isBefore(expiry, today)) {
      return 'Expired';
    }
    if (isBefore(expiry, addDays(today, 30))) {
      return 'Expiring Soon';
    }
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
      const response = await individualApi.getByCompany(companyId, search, sort, filter);
      setIndividuals(response.data);
      setDialogOpen(false);
    } catch (error) {
      console.error('Error saving individual:', error);
    }
  };

  const handleConfirmDelete = async () => {
    try {
      await individualApi.delete(individualToDelete._id);
      // Refresh the list
      const response = await individualApi.getByCompany(companyId, search, sort, filter);
      setIndividuals(response.data);
      setConfirmDialogOpen(false);
    } catch (error) {
      console.error('Error deleting individual:', error);
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
      component="main"
      sx={{ 
        width: '100%',
        minHeight: '100vh',
        bgcolor: 'background.default',
        paddingTop: '24px',
        paddingBottom: '24px'
      }}
    >
      <Container 
        maxWidth="lg"
        sx={{
          height: '100%'
        }}
      >
        <Fade in timeout={800}>
          <Box>
            {/* Company Info Header */}
            {company && (
              <Box 
                sx={{ 
                  mb: 3,
                  p: 3,
                  bgcolor: 'background.paper',
                  borderRadius: 2,
                  boxShadow: '0 2px 8px rgba(0,0,0,0.05)'
                }}
              >
                <Typography variant="h5" fontWeight="bold" gutterBottom>
                  {company.name}
                </Typography>
                <Typography color="text.secondary">
                  {company.address}
                </Typography>
              </Box>
            )}

            {/* Controls Section */}
            <Box 
              sx={{ 
                display: 'flex', 
                gap: 2, 
                mb: 3,
                flexDirection: { xs: 'column', sm: 'row' },
                alignItems: { xs: 'stretch', sm: 'center' }
              }}
            >
              <TextField
                placeholder="Search individuals..."
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
                    <MenuItem value="all">All</MenuItem>
                    <MenuItem value="active">Active</MenuItem>
                    <MenuItem value="expired">Expired</MenuItem>
                    <MenuItem value="expiring">Expiring Soon</MenuItem>
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
                    <MenuItem value="expiryDate">Expiry Date</MenuItem>
                    <MenuItem value="issueDate">Issue Date</MenuItem>
                  </Select>
                </FormControl>
              </Box>
            </Box>

            {/* Table Section */}
            <TableContainer 
              component={Paper}
              sx={{ 
                borderRadius: 2,
                boxShadow: '0 4px 12px rgba(0,0,0,0.05)',
                overflow: 'hidden'
              }}
            >
              <Table>
                <TableHead>
                  <TableRow sx={{ bgcolor: 'primary.main' }}>
                    <TableCell sx={{ color: 'white', fontWeight: 'bold', whiteSpace: 'nowrap' }}>Name</TableCell>
                    <TableCell sx={{ color: 'white', fontWeight: 'bold', whiteSpace: 'nowrap' }}>ID Number</TableCell>
                    <TableCell sx={{ color: 'white', fontWeight: 'bold', whiteSpace: 'nowrap' }}>Position</TableCell>
                    <TableCell sx={{ color: 'white', fontWeight: 'bold', whiteSpace: 'nowrap' }}>Issue Date</TableCell>
                    <TableCell sx={{ color: 'white', fontWeight: 'bold', whiteSpace: 'nowrap' }}>Expiry Date</TableCell>
                    <TableCell sx={{ color: 'white', fontWeight: 'bold', whiteSpace: 'nowrap' }}>Status</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {individuals.map((individual) => {
                    const status = getExpiryStatus(individual.expiryDate);
                    return (
                      <TableRow 
                        key={individual._id}
                        sx={{ 
                          '&:hover': { 
                            bgcolor: 'action.hover',
                            cursor: 'pointer'
                          },
                          transition: 'background-color 0.2s'
                        }}
                        onClick={() => handleEdit(individual)}
                      >
                        <TableCell sx={{ whiteSpace: 'nowrap' }}>{individual.name}</TableCell>
                        <TableCell sx={{ whiteSpace: 'nowrap' }}>{individual.idNumber}</TableCell>
                        <TableCell sx={{ whiteSpace: 'nowrap' }}>{individual.position}</TableCell>
                        <TableCell sx={{ whiteSpace: 'nowrap' }}>{format(new Date(individual.issueDate), 'dd/MM/yyyy')}</TableCell>
                        <TableCell sx={{ whiteSpace: 'nowrap' }}>{format(new Date(individual.expiryDate), 'dd/MM/yyyy')}</TableCell>
                        <TableCell>
                          <Chip 
                            label={status}
                            size="small"
                            sx={{ 
                              bgcolor: 
                                status === 'Active' ? 'success.light' :
                                status === 'Expired' ? 'error.light' :
                                'warning.light',
                              color: 
                                status === 'Active' ? 'success.dark' :
                                status === 'Expired' ? 'error.dark' :
                                'warning.dark',
                              fontWeight: 'medium'
                            }}
                          />
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </TableContainer>

            {/* Pagination Section */}
            <Box 
              sx={{ 
                mt: 3, 
                display: 'flex', 
                justifyContent: 'center'
              }}
            >
              <Pagination 
                count={10} 
                page={page} 
                onChange={(e, value) => setPage(value)}
                color="primary"
                shape="rounded"
                showFirstButton
                showLastButton
              />
            </Box>
          </Box>
        </Fade>
      </Container>

      {/* Add Button */}
      {admin && (
        <Fab
          color="primary"
          sx={{ 
            position: 'fixed', 
            bottom: 24, 
            right: 24,
            transition: 'transform 0.2s',
            '&:hover': {
              transform: 'scale(1.1)'
            }
          }}
          onClick={handleAdd}
        >
          <AddIcon />
        </Fab>
      )}

      {/* Dialogs */}
      <IndividualDialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        onSubmit={handleSubmit}
        individual={selectedIndividual}
      />

      <ConfirmDialog
        open={confirmDialogOpen}
        onClose={() => setConfirmDialogOpen(false)}
        onConfirm={handleConfirmDelete}
        title="Confirm Delete"
        message="Are you sure you want to delete this ID card? This action cannot be undone."
      />
    </Box>
  );
}

export default IndividualList; 