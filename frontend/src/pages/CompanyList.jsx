import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Container,
  Grid,
  Card,
  CardContent,
  Typography,
  Box,
  CircularProgress,
  TextField,
  Button,
  IconButton,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Pagination,
  InputAdornment
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import LoginIcon from '@mui/icons-material/Login';
import SearchIcon from '@mui/icons-material/Search';
import { companyApi, mainPersonApi } from '../services/api';
import { useAuth } from '../context/AuthContext';
import CompanyDialog from '../components/dialogs/CompanyDialog';
import ConfirmDialog from '../components/dialogs/ConfirmDialog';
import ErrorAlert from '../components/ErrorAlert';

function CompanyList() {
  const { id: mainPersonId } = useParams();
  const [companies, setCompanies] = useState([]);
  const [mainPerson, setMainPerson] = useState(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('all');
  const [sort, setSort] = useState('name');
  const [page, setPage] = useState(1);
  const { admin } = useAuth();
  const navigate = useNavigate();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedCompany, setSelectedCompany] = useState(null);
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);
  const [companyToDelete, setCompanyToDelete] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [companiesRes, mainPersonRes] = await Promise.all([
          companyApi.getByMainPerson(mainPersonId),
          mainPersonApi.getAll()
        ]);
        setCompanies(companiesRes.data);
        setMainPerson(mainPersonRes.data.find(p => p._id === mainPersonId));
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [mainPersonId]);

  const filteredCompanies = companies.filter(company =>
    company.name.toLowerCase().includes(search.toLowerCase())
  );

  const handleAdd = () => {
    setSelectedCompany(null);
    setDialogOpen(true);
  };

  const handleEdit = (company) => {
    setSelectedCompany(company);
    setDialogOpen(true);
  };

  const handleDelete = (company) => {
    setCompanyToDelete(company);
    setConfirmDialogOpen(true);
  };

  const handleSubmit = async (formData) => {
    try {
      if (selectedCompany) {
        await companyApi.update(selectedCompany._id, { ...formData, mainPerson: mainPersonId });
      } else {
        await companyApi.create({ ...formData, mainPerson: mainPersonId });
      }
      const response = await companyApi.getByMainPerson(mainPersonId);
      setCompanies(response.data);
      setDialogOpen(false);
    } catch (error) {
      setError(error.response?.data?.message || 'Error saving company');
    }
  };

  const handleConfirmDelete = async () => {
    try {
      await companyApi.delete(companyToDelete._id);
      const response = await companyApi.getByMainPerson(mainPersonId);
      setCompanies(response.data);
      setConfirmDialogOpen(false);
    } catch (error) {
      setError(error.response?.data?.message || 'Error deleting company');
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
      {/* Search and Login Section */}
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
        <Box sx={{ 
          display: 'flex', 
          alignItems: 'center',
          width: '100%',
          maxWidth: '600px',
          mb: 4
        }}>
          <TextField
            placeholder="Search companies..."
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
              <MenuItem value="all">All Companies</MenuItem>
              <MenuItem value="active">Active</MenuItem>
              <MenuItem value="inactive">Inactive</MenuItem>
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
              <MenuItem value="oldest">Oldest</MenuItem>
            </Select>
          </FormControl>
        </Box>

        {/* Companies Grid */}
        <Grid container spacing={3} sx={{ mb: 4 }}>
          {filteredCompanies.map((company) => (
            <Grid item xs={12} sm={6} md={3} key={company._id}>
              <Card 
                onClick={() => navigate(`/company/${company._id}/individuals`)}
                sx={{ 
                  cursor: 'pointer',
                  transition: 'all 0.2s ease-in-out',
                  height: '100%',
                  '&:hover': {
                    transform: 'scale(1.02)',
                    boxShadow: 3
                  },
                  borderRadius: '8px'
                }}
              >
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    {company.name}
                  </Typography>
                  <Typography color="text.secondary" variant="body2">
                    {company.address}
                  </Typography>
                  <Typography color="text.secondary" variant="body2">
                    {company.contactNumber}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>

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
    </Box>
  );
}

export default CompanyList; 