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
  Avatar,
  CircularProgress,
  Skeleton
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  ArrowBack as ArrowBackIcon,
  AdminPanelSettings as AdminIcon,
  Person as UserIcon
} from '@mui/icons-material';
import { userApi, mainPersonApi } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { alpha } from '@mui/material/styles';

const UserTableSkeleton = () => {
  return (
    <TableContainer 
      component={Paper} 
      elevation={3} 
      sx={{ 
        borderRadius: 4,
        overflow: 'hidden'
      }}
    >
      <Table>
        <TableHead>
          <TableRow>
            <TableCell width="30%">Username</TableCell>
            <TableCell width="15%">Role</TableCell>
            <TableCell width="15%">Income Access</TableCell>
            <TableCell width="30%">Allowed Main Persons</TableCell>
            <TableCell width="10%" align="right">Actions</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {[...Array(5)].map((_, index) => (
            <TableRow key={index}>
              <TableCell>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <Skeleton variant="circular" width={40} height={40} />
                  <Skeleton variant="text" width={150} />
                </Box>
              </TableCell>
              <TableCell>
                <Skeleton variant="rounded" width={80} height={24} />
              </TableCell>
              <TableCell>
                <Skeleton variant="rounded" width={60} height={24} />
              </TableCell>
              <TableCell>
                <Box sx={{ display: 'flex', gap: 1 }}>
                  <Skeleton variant="rounded" width={80} height={24} />
                  <Skeleton variant="rounded" width={80} height={24} />
                </Box>
              </TableCell>
              <TableCell align="right">
                <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1 }}>
                  <Skeleton variant="circular" width={32} height={32} />
                  <Skeleton variant="circular" width={32} height={32} />
                </Box>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
};

const UserManagement = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();
  const theme = useTheme();
  const { user } = useAuth();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [userToDelete, setUserToDelete] = useState(null);
  const [formData, setFormData] = useState({
    username: '',
    password: '',
    isAdmin: false,
    hasIncomeAccess: false,
    allowedMainPersons: []
  });
  const [mainPersons, setMainPersons] = useState([]);
  const [dialogMode, setDialogMode] = useState('add'); // 'add' or 'edit'

  // Fetch users on component mount
  useEffect(() => {
    fetchUsers();
    fetchMainPersons();
  }, []);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const response = await userApi.getAll();
      console.log('Fetched users:', response.data); // Log the fetched users
      setUsers(response.data);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching users:', error);
      setError(error.response?.data?.message || 'Failed to fetch users');
      setLoading(false);
    }
  };

  const fetchMainPersons = async () => {
    try {
      const response = await mainPersonApi.getAll();
      setMainPersons(response.data);
    } catch (error) {
      console.error('Error fetching main persons:', error);
      setError('Failed to fetch main persons list');
    }
  };

  const handleEdit = (userToEdit) => {
    setFormData({
      _id: userToEdit._id,
      username: userToEdit.username,
      password: '', // Clear password for security
      isAdmin: userToEdit.isAdmin,
      hasIncomeAccess: userToEdit.hasIncomeAccess,
      allowedMainPersons: userToEdit.allowedMainPersons.map(person => person._id) // Extract IDs
    });
    setDialogMode('edit');
    setDialogOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setError(null);
      if (dialogMode === 'add') {
        await userApi.create(formData);
      } else {
        // Don't send password if it's empty during edit
        const updateData = { ...formData };
        if (!updateData.password) delete updateData.password;
        await userApi.update(formData._id, updateData);
      }
      setDialogOpen(false);
      setFormData({ 
        username: '', 
        password: '', 
        isAdmin: false, 
        hasIncomeAccess: false, 
        allowedMainPersons: [] 
      });
      setDialogMode('add');
      fetchUsers();
    } catch (error) {
      console.error('Error saving user:', error);
      setError(error.response?.data?.message || 'Failed to save user');
    }
  };

  const handleDelete = async (userId) => {
    try {
      await userApi.delete(userId);
      setDeleteConfirmOpen(false);
      setUserToDelete(null);
      fetchUsers(); // Refresh the users list
    } catch (error) {
      console.error('Error deleting user:', error);
      setError(error.response?.data?.message || 'Failed to delete user');
    }
  };

  if (!user?.isAdmin) {
    return (
      <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
        <Alert severity="error">You don't have permission to access this page.</Alert>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      {!loading && (
        <Box 
          sx={{ 
            mb: 5,
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            background: theme.palette.background.paper,
            p: 3,
            borderRadius: 3,
            boxShadow: theme.shadows[2]
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 3 }}>
            <Button
              variant="outlined"
              startIcon={<ArrowBackIcon />}
              onClick={() => navigate(-1)}
              sx={{
                borderRadius: 2,
                borderWidth: 2,
                '&:hover': {
                  borderWidth: 2,
                  background: alpha(theme.palette.primary.main, 0.1)
                }
              }}
            >
              Back
            </Button>
            <Box>
              <Typography 
                variant="h4" 
                component="h1"
                sx={{ 
                  fontWeight: 600,
                  background: `linear-gradient(45deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`,
                  backgroundClip: 'text',
                  WebkitBackgroundClip: 'text',
                  color: 'transparent'
                }}
              >
                User Management
              </Typography>
              <Typography variant="subtitle1" color="text.secondary">
                Manage system users and their permissions
              </Typography>
            </Box>
          </Box>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => setDialogOpen(true)}
            sx={{ 
              borderRadius: 2,
              px: 3,
              py: 1,
              background: `linear-gradient(45deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`,
              boxShadow: `0 4px 12px ${alpha(theme.palette.primary.main, 0.3)}`,
              '&:hover': {
                background: `linear-gradient(45deg, ${theme.palette.primary.dark}, ${theme.palette.secondary.dark})`,
              }
            }}
          >
            Add User
          </Button>
        </Box>
      )}

      {loading ? (
        <Fade in timeout={800}>
          <Box>
            <Box sx={{ mb: 5 }}>
              <Skeleton variant="rounded" width={200} height={40} sx={{ mb: 1 }} />
              <Skeleton variant="text" width={300} />
            </Box>
            <UserTableSkeleton />
          </Box>
        </Fade>
      ) : error ? (
        <Alert 
          severity="error" 
          sx={{ 
            mb: 2, 
            borderRadius: 2,
            boxShadow: theme.shadows[2]
          }}
          action={
            <Button color="inherit" size="small" onClick={fetchUsers}>
              Retry
            </Button>
          }
        >
          {error}
        </Alert>
      ) : (
        <Fade in timeout={800}>
          <TableContainer 
            component={Paper} 
            elevation={3} 
            sx={{ 
              borderRadius: 4,
              overflow: 'hidden',
              transform: 'translateY(0)', // Initial position
              transition: 'all 0.3s ease',
              '& .MuiTableRow-root': {
                transition: 'all 0.2s ease',
              },
              '& .MuiTableCell-head': {
                backgroundColor: theme.palette.mode === 'dark' 
                  ? alpha(theme.palette.primary.main, 0.2)
                  : alpha(theme.palette.primary.main, 0.1),
                color: theme.palette.text.primary,
                fontWeight: 600,
                fontSize: '0.95rem'
              },
              '& .MuiTableCell-root': {
                borderColor: theme.palette.divider
              }
            }}
          >
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell width="30%">Username</TableCell>
                  <TableCell width="15%">Role</TableCell>
                  <TableCell width="15%">Income Access</TableCell>
                  <TableCell width="30%">Allowed Main Persons</TableCell>
                  <TableCell width="10%" align="right">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {users.map((user) => (
                  <TableRow 
                    key={user._id}
                    sx={{ 
                      transition: 'all 0.2s',
                      '&:hover': { 
                        backgroundColor: alpha(theme.palette.primary.main, 0.05),
                        transform: 'translateX(6px)'
                      }
                    }}
                  >
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                        <Avatar 
                          sx={{ 
                            bgcolor: user.isAdmin 
                              ? alpha(theme.palette.primary.main, 0.9)
                              : alpha(theme.palette.secondary.main, 0.9),
                            width: 40,
                            height: 40,
                            boxShadow: `0 2px 8px ${alpha(theme.palette.common.black, 0.15)}`
                          }}
                        >
                          {user.isAdmin ? <AdminIcon /> : <UserIcon />}
                        </Avatar>
                        <Box>
                          <Typography fontWeight="600">{user.username}</Typography>
                          <Typography variant="caption" color="text.secondary">
                            ID: {user._id.slice(-6)}
                          </Typography>
                        </Box>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Chip 
                        label={user.isAdmin ? 'Admin' : 'User'}
                        color={user.isAdmin ? 'primary' : 'default'}
                        size="small"
                        sx={{ 
                          fontWeight: 600,
                          px: 1,
                          borderRadius: '6px',
                          background: user.isAdmin 
                            ? alpha(theme.palette.primary.main, 0.1)
                            : alpha(theme.palette.grey[500], 0.1),
                          border: '2px solid',
                          borderColor: user.isAdmin 
                            ? alpha(theme.palette.primary.main, 0.3)
                            : alpha(theme.palette.grey[500], 0.2)
                        }}
                      />
                    </TableCell>
                    <TableCell>
                      <Chip 
                        label={user.hasIncomeAccess ? 'Yes' : 'No'}
                        color={user.hasIncomeAccess ? 'success' : 'error'}
                        size="small"
                        sx={{ 
                          fontWeight: 600,
                          px: 1,
                          borderRadius: '6px',
                          background: user.hasIncomeAccess
                            ? alpha(theme.palette.success.main, 0.1)
                            : alpha(theme.palette.error.main, 0.1),
                          border: '2px solid',
                          borderColor: user.hasIncomeAccess
                            ? alpha(theme.palette.success.main, 0.3)
                            : alpha(theme.palette.error.main, 0.3)
                        }}
                      />
                    </TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
                        {user.allowedMainPersons.length > 0 ? (
                          user.allowedMainPersons.map((person, index) => (
                            <Chip
                              key={person._id || index}
                              label={person.name || 'Unknown'}
                              size="small"
                              sx={{ 
                                borderRadius: '6px',
                                background: alpha(theme.palette.info.main, 0.1),
                                border: `2px solid ${alpha(theme.palette.info.main, 0.3)}`,
                                fontWeight: 500,
                                transition: 'all 0.2s',
                                '&:hover': { 
                                  background: alpha(theme.palette.info.main, 0.2)
                                }
                              }}
                            />
                          ))
                        ) : (
                          <Typography 
                            variant="body2" 
                            sx={{ 
                              color: alpha(theme.palette.error.main, 0.7),
                              fontStyle: 'italic'
                            }}
                          >
                            No access
                          </Typography>
                        )}
                      </Box>
                    </TableCell>
                    <TableCell align="right">
                      <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1 }}>
                        <Tooltip title="Edit User" arrow>
                          <IconButton 
                            onClick={() => handleEdit(user)}
                            sx={{ 
                              color: theme.palette.primary.main,
                              '&:hover': { 
                                background: alpha(theme.palette.primary.main, 0.1)
                              }
                            }}
                          >
                            <EditIcon />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Delete User" arrow>
                          <IconButton 
                            onClick={() => {
                              setUserToDelete(user);
                              setDeleteConfirmOpen(true);
                            }}
                            sx={{ 
                              color: theme.palette.error.main,
                              '&:hover': { 
                                background: alpha(theme.palette.error.main, 0.1)
                              }
                            }}
                          >
                            <DeleteIcon />
                          </IconButton>
                        </Tooltip>
                      </Box>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Fade>
      )}

      {/* Enhanced Dialog Styling */}
      <Dialog 
        open={dialogOpen}
        onClose={() => {
          setDialogOpen(false);
          setDialogMode('add');
          setFormData({ 
            username: '', 
            password: '', 
            isAdmin: false, 
            hasIncomeAccess: false, 
            allowedMainPersons: [] 
          });
        }}
        fullWidth
        maxWidth="sm"
        PaperProps={{
          sx: {
            borderRadius: 4,
            overflow: 'hidden',
            boxShadow: '0 8px 32px rgba(0,0,0,0.1)'
          }
        }}
      >
        <form onSubmit={handleSubmit}>
          <DialogTitle sx={{ 
            borderBottom: `1px solid ${theme.palette.divider}`,
            background: theme.palette.background.default,
            px: 3,
            py: 2
          }}>
            <Typography variant="h5" fontWeight={600}>
              {dialogMode === 'add' ? 'Add New User' : 'Edit User'}
            </Typography>
          </DialogTitle>
          <DialogContent sx={{ p: 3 , mt: 3 }}>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
              <Box sx={{ display: 'flex', gap: 2 }}>
                <TextField
                  label="Username"
                  fullWidth
                  value={formData.username}
                  onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                  required
                />
                <TextField
                  label="Password"
                  type="password"
                  fullWidth
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  required={dialogMode === 'add'}
                  helperText={dialogMode === 'edit' ? "Leave blank to keep current password" : ""}
                />
              </Box>
              <Box sx={{ display: 'flex', gap: 2 }}>
                <FormControl fullWidth>
                  <InputLabel>Role</InputLabel>
                  <Select
                    value={formData.isAdmin}
                    label="Role"
                    onChange={(e) => setFormData({ ...formData, isAdmin: e.target.value })}
                  >
                    <MenuItem value={false}>User</MenuItem>
                    <MenuItem value={true}>Admin</MenuItem>
                  </Select>
                </FormControl>
                <FormControl fullWidth>
                  <InputLabel>Income Access</InputLabel>
                  <Select
                    value={formData.hasIncomeAccess}
                    label="Income Access"
                    onChange={(e) => setFormData({ ...formData, hasIncomeAccess: e.target.value })}
                  >
                    <MenuItem value={false}>No</MenuItem>
                    <MenuItem value={true}>Yes</MenuItem>
                  </Select>
                </FormControl>
              </Box>
              <FormControl fullWidth>
                <InputLabel>Allowed Main Persons</InputLabel>
                <Select
                  multiple
                  value={formData.allowedMainPersons}
                  label="Allowed Main Persons"
                  onChange={(e) => setFormData({ ...formData, allowedMainPersons: e.target.value })}
                  renderValue={(selected) => (
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                      {selected.map((value) => {
                        const mainPerson = mainPersons.find(mp => mp._id === value);
                        return (
                          <Chip 
                            key={value} 
                            label={mainPerson?.name || value}
                            size="small"
                          />
                        );
                      })}
                    </Box>
                  )}
                >
                  {mainPersons.map((mainPerson) => (
                    <MenuItem key={mainPerson._id} value={mainPerson._id}>
                      {mainPerson.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Box>
          </DialogContent>
          <DialogActions sx={{ 
            p: 3, 
            background: theme.palette.background.default,
            borderTop: `1px solid ${theme.palette.divider}`
          }}>
            <Button 
              onClick={() => {
                setDialogOpen(false);
                setDialogMode('add');
                setFormData({ 
                  username: '', 
                  password: '', 
                  isAdmin: false, 
                  hasIncomeAccess: false, 
                  allowedMainPersons: [] 
                });
              }}
              sx={{ 
                borderRadius: 2,
                px: 3,
                color: theme.palette.text.secondary
              }}
            >
              Cancel
            </Button>
            <Button 
              type="submit" 
              variant="contained"
              sx={{ 
                borderRadius: 2,
                px: 3,
                background: `linear-gradient(45deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`,
                boxShadow: `0 4px 12px ${alpha(theme.palette.primary.main, 0.3)}`,
              }}
            >
              {dialogMode === 'add' ? 'Add User' : 'Save Changes'}
            </Button>
          </DialogActions>
        </form>
      </Dialog>

      {/* Enhanced Delete Dialog */}
      <Dialog
        open={deleteConfirmOpen}
        onClose={() => setDeleteConfirmOpen(false)}
        PaperProps={{
          sx: {
            borderRadius: 4,
            overflow: 'hidden',
            boxShadow: '0 8px 32px rgba(0,0,0,0.1)'
          }
        }}
      >
        <DialogTitle 
          sx={{ 
            color: theme.palette.error.main,
            borderBottom: `1px solid ${theme.palette.divider}`,
            px: 3,
            py: 2
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <DeleteIcon color="error" />
            <Typography variant="h5" fontWeight={600}>
              Confirm Delete
            </Typography>
          </Box>
        </DialogTitle>
        <DialogContent sx={{ p: 3 }}>
          <Typography>
            Are you sure you want to delete user <strong>"{userToDelete?.username}"</strong>? 
            This action cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions sx={{ 
          p: 3,
          background: theme.palette.background.default,
          borderTop: `1px solid ${theme.palette.divider}`
        }}>
          <Button 
            onClick={() => setDeleteConfirmOpen(false)}
            sx={{ 
              borderRadius: 2,
              px: 3,
              color: theme.palette.text.secondary
            }}
          >
            Cancel
          </Button>
          <Button 
            onClick={() => handleDelete(userToDelete?._id)}
            variant="contained"
            color="error"
            sx={{ 
              borderRadius: 2,
              px: 3,
              boxShadow: `0 4px 12px ${alpha(theme.palette.error.main, 0.3)}`,
            }}
          >
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default UserManagement; 