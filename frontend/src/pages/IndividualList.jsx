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
  CircularProgress
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import LoginIcon from '@mui/icons-material/Login';
import { individualApi, companyApi } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { format } from 'date-fns';
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
    
    if (isBefore(expiry, addDays(today, 5))) {
      return 'error';
    }
    if (isBefore(expiry, addDays(today, 10))) {
      return 'warning';
    }
    return 'default';
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
          width: '100vw',
          height: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: '#ffffff'
        }}
      >
        <CircularProgress size={60} />
      </Box>
    );
  }

  return (
    <Box 
      sx={{ 
        width: '100vw',
        minHeight: '100vh',
        backgroundColor: '#ffffff',
        py: 4
      }}
    >
      <Box 
        sx={{ 
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          width: '100%',
          maxWidth: '1200px',
          margin: '0 auto',
          px: 3
        }}
      >
        {/* Search and Login Section */}
        <Box sx={{ 
          display: 'flex', 
          alignItems: 'center',
          width: '100%',
          maxWidth: '600px',
          mb: 4
        }}>
          <TextField
            placeholder="Search individuals..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            fullWidth
            sx={{ 
              '& .MuiOutlinedInput-root': {
                borderRadius: '8px'
              }
            }}
            InputProps={{
              endAdornment: (
                <InputAdornment position="end">
                  <SearchIcon color="action" />
                </InputAdornment>
              )
            }}
          />
          <IconButton 
            onClick={() => navigate('/admin/login')}
            sx={{ ml: 2 }}
          >
            <LoginIcon />
          </IconButton>
        </Box>

        {/* Filter and Sort Section */}
        <Box sx={{ 
          display: 'flex',
          gap: 2,
          mb: 4,
          width: '100%',
          maxWidth: '600px'
        }}>
          <FormControl fullWidth>
            <InputLabel>Filter</InputLabel>
            <Select
              value={filter}
              label="Filter"
              onChange={(e) => setFilter(e.target.value)}
            >
              <MenuItem value="all">All</MenuItem>
              <MenuItem value="active">Active</MenuItem>
              <MenuItem value="expired">Expired</MenuItem>
            </Select>
          </FormControl>

          <FormControl fullWidth>
            <InputLabel>Sort By</InputLabel>
            <Select
              value={sort}
              label="Sort By"
              onChange={(e) => setSort(e.target.value)}
            >
              <MenuItem value="name">Name</MenuItem>
              <MenuItem value="recent">Most Recent</MenuItem>
              <MenuItem value="expiry">Expiry Date</MenuItem>
            </Select>
          </FormControl>
        </Box>

        {/* Table Section */}
        <TableContainer 
          component={Paper} 
          sx={{ 
            mb: 4,
            borderRadius: '8px',
            boxShadow: 2
          }}
        >
          <Table>
            <TableHead>
              <TableRow sx={{ backgroundColor: '#f5f5f5' }}>
                <TableCell>Name</TableCell>
                <TableCell>ID Number</TableCell>
                <TableCell>Position</TableCell>
                <TableCell>Issue Date</TableCell>
                <TableCell>Expiry Date</TableCell>
                <TableCell>Status</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {individuals.map((individual) => (
                <TableRow 
                  key={individual._id}
                  sx={{ 
                    '&:hover': { 
                      backgroundColor: '#f8f8f8',
                      cursor: 'pointer'
                    }
                  }}
                >
                  <TableCell>{individual.name}</TableCell>
                  <TableCell>{individual.idNumber}</TableCell>
                  <TableCell>{individual.position}</TableCell>
                  <TableCell>{format(new Date(individual.issueDate), 'dd/MM/yyyy')}</TableCell>
                  <TableCell>{format(new Date(individual.expiryDate), 'dd/MM/yyyy')}</TableCell>
                  <TableCell>{individual.status}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>

        {/* Pagination */}
        <Pagination 
          count={10} 
          page={page} 
          onChange={(e, value) => setPage(value)}
          color="primary"
          shape="rounded"
          showFirstButton
          showLastButton
          sx={{
            '& .MuiPagination-ul': { gap: 1 }
          }}
        />
      </Box>

      {admin && (
        <Fab
          color="primary"
          sx={{ position: 'fixed', bottom: 16, right: 16 }}
          onClick={handleAdd}
        >
          <AddIcon />
        </Fab>
      )}

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