import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
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
  Skeleton,
  Grid
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
  const { t } = useTranslation();
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
            <TableCell width="30%">{t('userManagement.table.username')}</TableCell>
            <TableCell width="15%">{t('userManagement.table.role')}</TableCell>
            <TableCell width="15%">{t('userManagement.table.incomeAccess')}</TableCell>
            <TableCell width="30%">{t('userManagement.table.allowedMainPersons')}</TableCell>
            <TableCell width="10%" align="right">{t('userManagement.table.actions')}</TableCell>
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
  const { t } = useTranslation();
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
    hasIncomeAccess: [],
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
      hasIncomeAccess: Array.isArray(userToEdit.hasIncomeAccess) 
        ? userToEdit.hasIncomeAccess 
        : [userToEdit.hasIncomeAccess], // Convert to array if it's not already
      allowedMainPersons: userToEdit.allowedMainPersons.map(person => person._id)
    });
    setDialogMode('edit');
    setDialogOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setError(null);
      const dataToSend = {
        ...formData,
        hasIncomeAccess: Array.isArray(formData.hasIncomeAccess) 
          ? formData.hasIncomeAccess 
          : [formData.hasIncomeAccess]
      };

      if (dialogMode === 'add') {
        await userApi.create(dataToSend);
      } else {
        // Don't send password if it's empty during edit
        if (!dataToSend.password) delete dataToSend.password;
        await userApi.update(formData._id, dataToSend);
      }
      setDialogOpen(false);
      setFormData({ 
        username: '', 
        password: '', 
        isAdmin: false, 
        hasIncomeAccess: [], 
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
        <Alert severity="error">{t('userManagement.noPermission')}</Alert>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      {!loading && (
        <Box 
          sx={{ 
            mb: 5,
            position: 'relative',
            background: theme.palette.background.paper,
            p: { xs: 2, sm: 3 },
            pt: { xs: 4, sm: 5 }, // Extra padding top to accommodate back button
            borderRadius: 3,
            boxShadow: theme.shadows[2]
          }}
        >
          {/* Back Button - Absolute positioned */}
          <IconButton
            onClick={() => navigate(-1)}
            sx={{
              position: 'absolute',
              top: { xs: -20, sm: -24 },
              left: { xs: 16, sm: 24 },
              borderRadius: 2,
              bgcolor: theme.palette.background.paper,
              border: `2px solid ${alpha(theme.palette.primary.main, 0.1)}`,
              boxShadow: theme.shadows[2],
              width: { xs: 40, sm: 48 },
              height: { xs: 40, sm: 48 },
              '&:hover': {
                bgcolor: alpha(theme.palette.primary.main, 0.1),
                border: `2px solid ${alpha(theme.palette.primary.main, 0.2)}`,
              }
            }}
          >
            <ArrowBackIcon />
          </IconButton>

          {/* Header Content */}
          <Box 
            sx={{ 
              display: 'flex',
              flexDirection: { xs: 'column', sm: 'row' },
              alignItems: { xs: 'center', sm: 'center' },
              justifyContent: 'space-between',
              gap: { xs: 2, sm: 0 },
              textAlign: { xs: 'center', sm: 'left' }
            }}
          >
            <Box>
              <Typography 
                variant="h4" 
                component="h1"
                sx={{ 
                  fontWeight: 600,
                  fontSize: { xs: '1.5rem', sm: '2rem' },
                  background: `linear-gradient(45deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`,
                  backgroundClip: 'text',
                  WebkitBackgroundClip: 'text',
                  color: 'transparent'
                }}
              >
                {t('userManagement.title')}
              </Typography>
              <Typography 
                variant="subtitle1" 
                color="text.secondary"
                sx={{ 
                  fontSize: { xs: '0.875rem', sm: '1rem' }
                }}
              >
                {t('userManagement.subtitle')}
              </Typography>
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
              {t('userManagement.buttons.addUser')}
            </Button>
          </Box>
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
              {t('userManagement.buttons.retry')}
            </Button>
          }
        >
          {error}
        </Alert>
      ) : (
        <Fade in timeout={800}>
          <Box>
            {/* Desktop Table View */}
            <TableContainer 
              component={Paper} 
              elevation={3} 
              sx={{ 
                borderRadius: 4,
                overflow: 'hidden',
                display: { xs: 'none', md: 'block' } // Hide on mobile
              }}
            >
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell width="30%">{t('userManagement.table.username')}</TableCell>
                    <TableCell width="15%">{t('userManagement.table.role')}</TableCell>
                    <TableCell width="15%">{t('userManagement.table.incomeAccess')}</TableCell>
                    <TableCell width="30%">{t('userManagement.table.allowedMainPersons')}</TableCell>
                    <TableCell width="10%" align="right">{t('userManagement.table.actions')}</TableCell>
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
                          label={user.isAdmin ? t('userManagement.roles.admin') : t('userManagement.roles.user')}
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
                        <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
                          {Array.isArray(user.hasIncomeAccess) && user.hasIncomeAccess.length > 0 ? (
                            user.hasIncomeAccess.map((access) => (
                              <Chip 
                                key={access}
                                label={t(`userManagement.access.${access}`)}
                                color={access === 'none' ? 'default' : 
                                       access === 'nasser' ? 'primary' : 'success'}
                                size="small"
                                sx={{ 
                                  fontWeight: 600,
                                  px: 1,
                                  borderRadius: '6px',
                                  background: access === 'none'
                                    ? alpha(theme.palette.grey[500], 0.1)
                                    : access === 'nasser'
                                    ? alpha(theme.palette.primary.main, 0.1)
                                    : alpha(theme.palette.success.main, 0.1),
                                  border: '2px solid',
                                  borderColor: access === 'none'
                                    ? alpha(theme.palette.grey[500], 0.2)
                                    : access === 'nasser'
                                    ? alpha(theme.palette.primary.main, 0.3)
                                    : alpha(theme.palette.success.main, 0.3)
                                }}
                              />
                            ))
                          ) : (
                            <Chip 
                              label={t('userManagement.access.none')}
                              color="default"
                              size="small"
                              sx={{ 
                                fontWeight: 600,
                                px: 1,
                                borderRadius: '6px',
                                background: alpha(theme.palette.grey[500], 0.1),
                                border: '2px solid',
                                borderColor: alpha(theme.palette.grey[500], 0.2)
                              }}
                            />
                          )}
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                          {user.allowedMainPersons.length > 0 ? (
                            user.allowedMainPersons.map((person, index) => (
                              <Chip
                                key={person._id || index}
                                label={person.name || t('common.na')}
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
                              {t('userManagement.table.noAccess')}
                            </Typography>
                          )}
                        </Box>
                      </TableCell>
                      <TableCell align="right">
                        <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1 }}>
                          <Tooltip title={t('userManagement.tooltips.edit')} arrow>
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
                          <Tooltip title={t('userManagement.tooltips.delete')} arrow>
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

            {/* Mobile Card View */}
            <Box 
              sx={{ 
                display: { xs: 'flex', md: 'none' },
                flexDirection: 'column',
                gap: 2
              }}
            >
              {users.map((user) => (
                <Paper
                  key={user._id}
                  elevation={2}
                  sx={{
                    p: 2,
                    borderRadius: 2,
                    transition: 'all 0.2s',
                    '&:hover': {
                      transform: 'translateY(-4px)',
                      boxShadow: theme.shadows[8]
                    }
                  }}
                >
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
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
                    <Box flex={1}>
                      <Typography fontWeight="600">{user.username}</Typography>
                      <Typography variant="caption" color="text.secondary">
                        ID: {user._id.slice(-6)}
                      </Typography>
                    </Box>
                    <Box sx={{ display: 'flex', gap: 1 }}>
                      <IconButton
                        size="small"
                        onClick={() => handleEdit(user)}
                        sx={{ 
                          bgcolor: alpha(theme.palette.primary.main, 0.1),
                          '&:hover': { bgcolor: alpha(theme.palette.primary.main, 0.2) }
                        }}
                      >
                        <EditIcon fontSize="small" />
                      </IconButton>
                      <IconButton
                        size="small"
                        onClick={() => {
                          setUserToDelete(user);
                          setDeleteConfirmOpen(true);
                        }}
                        sx={{ 
                          bgcolor: alpha(theme.palette.error.main, 0.1),
                          '&:hover': { bgcolor: alpha(theme.palette.error.main, 0.2) }
                        }}
                      >
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    </Box>
                  </Box>

                  <Grid container spacing={2}>
                    <Grid item xs={6}>
                      <Typography variant="caption" color="text.secondary">Role</Typography>
                      <Chip 
                        label={user.isAdmin ? t('userManagement.roles.admin') : t('userManagement.roles.user')}
                        color={user.isAdmin ? 'primary' : 'default'}
                        size="small"
                        sx={{ 
                          mt: 0.5,
                          fontWeight: 600,
                          width: '100%',
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
                    </Grid>
                    <Grid item xs={6}>
                      <Typography variant="caption" color="text.secondary">Income Access</Typography>
                      <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
                        {Array.isArray(user.hasIncomeAccess) && user.hasIncomeAccess.length > 0 ? (
                          user.hasIncomeAccess.map((access) => (
                            <Chip 
                              key={access}
                              label={t(`userManagement.access.${access}`)}
                              color={access === 'none' ? 'default' : 
                                     access === 'nasser' ? 'primary' : 'success'}
                              size="small"
                              sx={{ 
                                fontWeight: 600,
                                px: 1,
                                borderRadius: '6px',
                                background: access === 'none'
                                  ? alpha(theme.palette.grey[500], 0.1)
                                  : access === 'nasser'
                                  ? alpha(theme.palette.primary.main, 0.1)
                                  : alpha(theme.palette.success.main, 0.1),
                                border: '2px solid',
                                borderColor: access === 'none'
                                  ? alpha(theme.palette.grey[500], 0.2)
                                  : access === 'nasser'
                                  ? alpha(theme.palette.primary.main, 0.3)
                                  : alpha(theme.palette.success.main, 0.3)
                              }}
                            />
                          ))
                        ) : (
                          <Chip 
                            label={t('userManagement.access.none')}
                            color="default"
                            size="small"
                            sx={{ 
                              fontWeight: 600,
                              px: 1,
                              borderRadius: '6px',
                              background: alpha(theme.palette.grey[500], 0.1),
                              border: '2px solid',
                              borderColor: alpha(theme.palette.grey[500], 0.2)
                            }}
                          />
                        )}
                      </Box>
                    </Grid>
                  </Grid>

                  <Box sx={{ mt: 2 }}>
                    <Typography variant="caption" color="text.secondary">
                      Allowed Main Persons
                    </Typography>
                    <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mt: 0.5 }}>
                      {user.allowedMainPersons.length > 0 ? (
                        user.allowedMainPersons.map((person, index) => (
                          <Chip
                            key={person._id || index}
                            label={person.name || t('common.na')}
                            size="small"
                            sx={{ 
                              borderRadius: '6px',
                              background: alpha(theme.palette.info.main, 0.1),
                              border: `2px solid ${alpha(theme.palette.info.main, 0.3)}`,
                              fontWeight: 500
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
                          {t('userManagement.table.noAccess')}
                        </Typography>
                      )}
                    </Box>
                  </Box>
                </Paper>
              ))}
            </Box>
          </Box>
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
            hasIncomeAccess: [], 
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
              {dialogMode === 'add' 
                ? t('userManagement.dialog.add.title')
                : t('userManagement.dialog.edit.title')}
            </Typography>
          </DialogTitle>
          <DialogContent sx={{ p: 3 , mt: 3 }}>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
              <Box sx={{ display: 'flex', gap: 2 }}>
                <TextField
                  label={t('userManagement.dialog.fields.username')}
                  fullWidth
                  value={formData.username}
                  onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                  required
                />
                <TextField
                  label={t('userManagement.dialog.fields.password')}
                  type="password"
                  fullWidth
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  required={dialogMode === 'add'}
                  helperText={dialogMode === 'edit' ? t('userManagement.dialog.edit.passwordHelp') : ""}
                />
              </Box>
              <Box sx={{ display: 'flex', gap: 2 }}>
                <FormControl fullWidth>
                  <InputLabel>{t('userManagement.dialog.fields.role')}</InputLabel>
                  <Select
                    value={formData.isAdmin}
                    label={t('userManagement.dialog.fields.role')}
                    onChange={(e) => setFormData({ ...formData, isAdmin: e.target.value })}
                  >
                    <MenuItem value={false}>{t('userManagement.roles.user')}</MenuItem>
                    <MenuItem value={true}>{t('userManagement.roles.admin')}</MenuItem>
                  </Select>
                </FormControl>
                <FormControl fullWidth>
                  <InputLabel>{t('userManagement.dialog.fields.incomeAccess')}</InputLabel>
                  <Select
                    multiple
                    value={Array.isArray(formData.hasIncomeAccess) ? formData.hasIncomeAccess : [formData.hasIncomeAccess]}
                    label={t('userManagement.dialog.fields.incomeAccess')}
                    onChange={(e) => setFormData({ ...formData, hasIncomeAccess: e.target.value })}
                    renderValue={(selected) => (
                      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                        {selected.map((value) => (
                          <Chip 
                            key={value} 
                            label={t(`userManagement.access.${value}`)}
                            size="small"
                          />
                        ))}
                      </Box>
                    )}
                  >
                    <MenuItem value="none">{t('userManagement.access.none')}</MenuItem>
                    <MenuItem value="nasser">{t('userManagement.access.nasser')}</MenuItem>
                    <MenuItem value="company">{t('userManagement.access.company')}</MenuItem>
                  </Select>
                </FormControl>
              </Box>
              <FormControl fullWidth>
                <InputLabel>{t('userManagement.dialog.fields.allowedMainPersons')}</InputLabel>
                <Select
                  multiple
                  value={formData.allowedMainPersons}
                  label={t('userManagement.dialog.fields.allowedMainPersons')}
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
                  hasIncomeAccess: [], 
                  allowedMainPersons: [] 
                });
              }}
              sx={{ 
                borderRadius: 2,
                px: 3,
                color: theme.palette.text.secondary
              }}
            >
              {t('userManagement.buttons.cancel')}
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
              {dialogMode === 'add' 
                ? t('userManagement.dialog.add.button')
                : t('userManagement.dialog.edit.button')}
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
              {t('userManagement.dialog.delete.title')}
            </Typography>
          </Box>
        </DialogTitle>
        <DialogContent sx={{ p: 3 }}>
          <Typography>
            {t('userManagement.dialog.delete.message', { username: userToDelete?.username })}
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
            {t('userManagement.buttons.cancel')}
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
            {t('userManagement.dialog.delete.button')}
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default UserManagement;