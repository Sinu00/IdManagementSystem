import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Container,
  Typography,
  Box,
  Button,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert,
  Chip,
  Tooltip,
  LinearProgress,
  Fade,
  useTheme,
  Divider,
  Avatar
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  ArrowBack as ArrowBackIcon,
  AdminPanelSettings as AdminIcon,
  Person as UserIcon,
  Search as SearchIcon
} from '@mui/icons-material';
import { userApi, mainPersonApi } from '../services/api';
import { useAuth } from '../context/AuthContext';

const UserManagement = () => {
  const theme = useTheme();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [users, setUsers] = useState([]);
  const [mainPersons, setMainPersons] = useState([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogMode, setDialogMode] = useState('add');
  const [selectedUser, setSelectedUser] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [userToDelete, setUserToDelete] = useState(null);
  const [formData, setFormData] = useState({
    username: '',
    password: '',
    role: 'user',
    mainPerson: ''
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [usersResponse, mainPersonsResponse] = await Promise.all([
        userApi.getAll(),
        mainPersonApi.getAll()
      ]);
      setUsers(usersResponse.data);
      setMainPersons(mainPersonsResponse.data);
    } catch (error) {
      setError('Failed to fetch data');
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = () => {
    setDialogMode('add');
    setSelectedUser(null);
    setFormData({
      username: '',
      password: '',
      role: 'user',
      mainPerson: ''
    });
    setDialogOpen(true);
  };

  const handleEdit = (user) => {
    setDialogMode('edit');
    setSelectedUser(user);
    setFormData({
      username: user.username,
      password: '',
      role: user.role,
      mainPerson: user.mainPerson?._id || ''
    });
    setDialogOpen(true);
  };

  const handleDelete = async (userId) => {
    try {
      await userApi.delete(userId);
      setDeleteConfirmOpen(false);
      fetchData();
    } catch (error) {
      setError('Failed to delete user');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (dialogMode === 'add') {
        await userApi.create(formData);
      } else {
        const updateData = { ...formData };
        if (!updateData.password) delete updateData.password;
        await userApi.update(selectedUser._id, updateData);
      }
      setDialogOpen(false);
      fetchData();
    } catch (error) {
      setError(error.response?.data?.message || 'Operation failed');
    }
  };

  // Filter users based on search query
  const filteredUsers = users.filter(user =>
    user.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (user.mainPerson?.name || '').toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <Container maxWidth="lg">
      <Box sx={{ mt: 4, mb: 4 }}>
        <Tooltip title="Return to previous page">
          <Button
            startIcon={<ArrowBackIcon />}
            onClick={() => navigate(-1)}
            sx={{ mb: 2 }}
            variant="outlined"
          >
            Back
          </Button>
        </Tooltip>

        <Paper elevation={3} sx={{ p: 3, mb: 4 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
            <Typography variant="h4" sx={{ fontWeight: 'bold', color: theme.palette.primary.main }}>
              User Management
            </Typography>
            <Tooltip title="Add new user">
              <Button
                variant="contained"
                startIcon={<AddIcon />}
                onClick={handleAdd}
                sx={{ 
                  borderRadius: 2,
                  px: 3,
                  py: 1,
                  boxShadow: 2,
                  '&:hover': { transform: 'translateY(-2px)' },
                  transition: 'transform 0.2s'
                }}
              >
                Add User
              </Button>
            </Tooltip>
          </Box>

          <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
            <TextField
              fullWidth
              variant="outlined"
              placeholder="Search users..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              InputProps={{
                startAdornment: <SearchIcon sx={{ color: 'text.secondary', mr: 1 }} />,
              }}
              sx={{ maxWidth: 400 }}
            />
          </Box>

          {error && (
            <Fade in={!!error}>
              <Alert 
                severity="error" 
                sx={{ mb: 2 }}
                onClose={() => setError('')}
              >
                {error}
              </Alert>
            </Fade>
          )}

          {loading ? (
            <Box sx={{ width: '100%', mt: 2 }}>
              <LinearProgress />
            </Box>
          ) : (
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>User</TableCell>
                    <TableCell>Role</TableCell>
                    <TableCell>Main Person</TableCell>
                    <TableCell align="right">Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {filteredUsers.map((user) => (
                    <TableRow 
                      key={user._id}
                      sx={{ 
                        '&:hover': { 
                          backgroundColor: theme.palette.action.hover 
                        }
                      }}
                    >
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                          <Avatar 
                            sx={{ 
                              bgcolor: user.role === 'admin' ? theme.palette.primary.main : theme.palette.secondary.main,
                              mr: 2 
                            }}
                          >
                            {user.role === 'admin' ? <AdminIcon /> : <UserIcon />}
                          </Avatar>
                          <Typography>{user.username}</Typography>
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Chip 
                          label={user.role}
                          color={user.role === 'admin' ? 'primary' : 'default'}
                          size="small"
                          sx={{ 
                            fontWeight: 'bold',
                            textTransform: 'uppercase',
                            letterSpacing: '0.5px'
                          }}
                        />
                      </TableCell>
                      <TableCell>
                        {user.mainPerson?.name || 
                          <Typography variant="body2" color="text.secondary">
                            Not assigned
                          </Typography>
                        }
                      </TableCell>
                      <TableCell align="right">
                        <Tooltip title="Edit user">
                          <IconButton 
                            onClick={() => handleEdit(user)}
                            sx={{ 
                              '&:hover': { 
                                color: theme.palette.primary.main,
                                transform: 'scale(1.1)'
                              },
                              transition: 'all 0.2s'
                            }}
                          >
                            <EditIcon />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Delete user">
                          <IconButton 
                            onClick={() => {
                              setUserToDelete(user);
                              setDeleteConfirmOpen(true);
                            }}
                            sx={{ 
                              '&:hover': { 
                                color: theme.palette.error.main,
                                transform: 'scale(1.1)'
                              },
                              transition: 'all 0.2s'
                            }}
                          >
                            <DeleteIcon />
                          </IconButton>
                        </Tooltip>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </Paper>

        {/* User Form Dialog */}
        <Dialog 
          open={dialogOpen} 
          onClose={() => setDialogOpen(false)} 
          maxWidth="sm" 
          fullWidth
          PaperProps={{
            elevation: 24,
            sx: { borderRadius: 2 }
          }}
        >
          <DialogTitle sx={{ 
            bgcolor: theme.palette.primary.main, 
            color: 'white',
            py: 2
          }}>
            {dialogMode === 'add' ? 'Add New User' : 'Edit User'}
          </DialogTitle>
          <DialogContent sx={{ mt: 2 }}>
            <Box component="form" onSubmit={handleSubmit} sx={{ mt: 2 }}>
              <TextField
                fullWidth
                label="Username"
                value={formData.username}
                onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                required
                margin="normal"
              />
              <TextField
                fullWidth
                label="Password"
                type="password"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                required={dialogMode === 'add'}
                margin="normal"
                helperText={dialogMode === 'edit' ? "Leave blank to keep current password" : ""}
              />
              <FormControl fullWidth margin="normal">
                <InputLabel>Role</InputLabel>
                <Select
                  value={formData.role}
                  onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                  label="Role"
                >
                  <MenuItem value="user">User</MenuItem>
                  <MenuItem value="admin">Admin</MenuItem>
                </Select>
              </FormControl>
              <FormControl fullWidth margin="normal">
                <InputLabel>Main Person</InputLabel>
                <Select
                  value={formData.mainPerson}
                  onChange={(e) => setFormData({ ...formData, mainPerson: e.target.value })}
                  label="Main Person"
                >
                  <MenuItem value="">None</MenuItem>
                  {mainPersons.map((person) => (
                    <MenuItem key={person._id} value={person._id}>
                      {person.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Box>
          </DialogContent>
          <DialogActions sx={{ p: 2, bgcolor: 'background.default' }}>
            <Button 
              onClick={() => setDialogOpen(false)}
              variant="outlined"
            >
              Cancel
            </Button>
            <Button 
              onClick={handleSubmit} 
              variant="contained"
              sx={{ 
                px: 3,
                '&:hover': { transform: 'translateY(-2px)' },
                transition: 'transform 0.2s'
              }}
            >
              {dialogMode === 'add' ? 'Add User' : 'Save Changes'}
            </Button>
          </DialogActions>
        </Dialog>

        {/* Delete Confirmation Dialog */}
        <Dialog
          open={deleteConfirmOpen}
          onClose={() => setDeleteConfirmOpen(false)}
          PaperProps={{
            elevation: 24,
            sx: { borderRadius: 2 }
          }}
        >
          <DialogTitle sx={{ color: theme.palette.error.main }}>
            Confirm Delete
          </DialogTitle>
          <DialogContent>
            <Typography>
              Are you sure you want to delete user "{userToDelete?.username}"? This action cannot be undone.
            </Typography>
          </DialogContent>
          <DialogActions sx={{ p: 2 }}>
            <Button 
              onClick={() => setDeleteConfirmOpen(false)}
              variant="outlined"
            >
              Cancel
            </Button>
            <Button 
              onClick={() => handleDelete(userToDelete?._id)}
              variant="contained"
              color="error"
              sx={{ 
                px: 3,
                '&:hover': { transform: 'translateY(-2px)' },
                transition: 'transform 0.2s'
              }}
            >
              Delete
            </Button>
          </DialogActions>
        </Dialog>
      </Box>
    </Container>
  );
};

export default UserManagement; 