import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Container,
  Typography,
  Box,
  Paper,
  Grid,
  IconButton,
  Button,
  Card,
  CardContent,
  Divider,
  Stack,
  Fade,
  useTheme,
  Avatar
} from '@mui/material';
import {
  ArrowBack as ArrowBackIcon,
  AccountBalanceWallet as WalletIcon,
  Add as AddIcon,
  TrendingUp as IncomeIcon,
  TrendingDown as ExpenseIcon,
  AttachMoney as MoneyIcon,
  Receipt as ReceiptIcon,
  DateRange as DateIcon
} from '@mui/icons-material';
import { useAuth } from '../context/AuthContext';

function IncomeExpense() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const theme = useTheme();

  return (
    <Box sx={{ width: '100%', minHeight: '100vh', bgcolor: 'background.default', pt: 4, pb: 6 }}>
      <Container maxWidth="lg">
        {/* Header Section */}
        <Box 
          sx={{ 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'space-between',
            mb: 4,
            flexWrap: 'wrap',
            gap: 2
          }}
        >
          <Box display="flex" alignItems="center" gap={2}>
            <IconButton 
              onClick={() => navigate(-1)} 
              sx={{ 
                color: 'primary.main',
                bgcolor: 'primary.lighter',
                '&:hover': { bgcolor: 'primary.light' }
              }}
            >
              <ArrowBackIcon />
            </IconButton>
            <Box>
              <Typography variant="h4" fontWeight="bold">
                Financial Overview
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Track your income and expenses
              </Typography>
            </Box>
          </Box>
          
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            sx={{
              borderRadius: 2,
              px: 3,
              py: 1.5,
              bgcolor: 'success.main',
              '&:hover': {
                bgcolor: 'success.dark',
                transform: 'translateY(-2px)',
                boxShadow: theme.shadows[4]
              },
              transition: 'all 0.2s'
            }}
          >
            New Transaction
          </Button>
        </Box>

        {/* Summary Cards */}
        <Grid container spacing={3} mb={4}>
          <Grid item xs={12} md={4}>
            <Card 
              sx={{ 
                height: '100%',
                borderRadius: 4,
                background: 'linear-gradient(135deg, #4CAF50 0%, #45a049 100%)',
                position: 'relative',
                overflow: 'hidden'
              }}
            >
              <Box
                sx={{
                  position: 'absolute',
                  right: -20,
                  top: -20,
                  width: 150,
                  height: 150,
                  borderRadius: '50%',
                  bgcolor: 'rgba(255,255,255,0.1)'
                }}
              />
              <CardContent sx={{ position: 'relative', p: 3 }}>
                <Avatar 
                  sx={{ 
                    bgcolor: 'rgba(255,255,255,0.2)',
                    mb: 2,
                    width: 48,
                    height: 48
                  }}
                >
                  <IncomeIcon />
                </Avatar>
                <Typography variant="h6" color="white" gutterBottom>
                  Total Income
                </Typography>
                <Typography variant="h3" fontWeight="bold" color="white">
                  SAR 0.00
                </Typography>
                <Typography variant="body2" color="rgba(255,255,255,0.7)" sx={{ mt: 1 }}>
                  +0% from last month
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          
          <Grid item xs={12} md={4}>
            <Card 
              sx={{ 
                height: '100%',
                borderRadius: 4,
                background: 'linear-gradient(135deg, #f44336 0%, #e53935 100%)',
                position: 'relative',
                overflow: 'hidden'
              }}
            >
              <Box
                sx={{
                  position: 'absolute',
                  right: -20,
                  top: -20,
                  width: 150,
                  height: 150,
                  borderRadius: '50%',
                  bgcolor: 'rgba(255,255,255,0.1)'
                }}
              />
              <CardContent sx={{ position: 'relative', p: 3 }}>
                <Avatar 
                  sx={{ 
                    bgcolor: 'rgba(255,255,255,0.2)',
                    mb: 2,
                    width: 48,
                    height: 48
                  }}
                >
                  <ExpenseIcon />
                </Avatar>
                <Typography variant="h6" color="white" gutterBottom>
                  Total Expense
                </Typography>
                <Typography variant="h3" fontWeight="bold" color="white">
                  SAR 0.00
                </Typography>
                <Typography variant="body2" color="rgba(255,255,255,0.7)" sx={{ mt: 1 }}>
                  +0% from last month
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          
          <Grid item xs={12} md={4}>
            <Card 
              sx={{ 
                height: '100%',
                borderRadius: 4,
                background: 'linear-gradient(135deg, #2196F3 0%, #1976D2 100%)',
                position: 'relative',
                overflow: 'hidden'
              }}
            >
              <Box
                sx={{
                  position: 'absolute',
                  right: -20,
                  top: -20,
                  width: 150,
                  height: 150,
                  borderRadius: '50%',
                  bgcolor: 'rgba(255,255,255,0.1)'
                }}
              />
              <CardContent sx={{ position: 'relative', p: 3 }}>
                <Avatar 
                  sx={{ 
                    bgcolor: 'rgba(255,255,255,0.2)',
                    mb: 2,
                    width: 48,
                    height: 48
                  }}
                >
                  <MoneyIcon />
                </Avatar>
                <Typography variant="h6" color="white" gutterBottom>
                  Net Balance
                </Typography>
                <Typography variant="h3" fontWeight="bold" color="white">
                  SAR 0.00
                </Typography>
                <Typography variant="body2" color="rgba(255,255,255,0.7)" sx={{ mt: 1 }}>
                  Current month
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        {/* Income & Expense Sections */}
        <Grid container spacing={3}>
          {/* Income Section */}
          <Grid item xs={12} md={6}>
            <Paper 
              elevation={0}
              sx={{ 
                p: 3, 
                borderRadius: 4,
                bgcolor: 'background.paper',
                border: '1px solid',
                borderColor: 'divider',
                height: '100%'
              }}
            >
              <Box 
                sx={{ 
                  display: 'flex', 
                  justifyContent: 'space-between', 
                  alignItems: 'center',
                  mb: 3,
                  flexWrap: 'wrap',
                  gap: 2
                }}
              >
                <Box display="flex" alignItems="center" gap={1}>
                  <Avatar 
                    sx={{ 
                      bgcolor: 'success.lighter',
                      color: 'success.main'
                    }}
                  >
                    <IncomeIcon />
                  </Avatar>
                  <Typography variant="h6" fontWeight="bold">
                    Income Details
                  </Typography>
                </Box>
                <Stack direction="row" spacing={1}>
                  <Button 
                    startIcon={<AddIcon />}
                    variant="contained"
                    size="small"
                    sx={{ 
                      borderRadius: 2,
                      bgcolor: 'success.main',
                      '&:hover': {
                        bgcolor: 'success.dark'
                      }
                    }}
                  >
                    Add
                  </Button>
                  <Button 
                    startIcon={<DateIcon />}
                    variant="outlined"
                    size="small"
                    sx={{ 
                      borderRadius: 2,
                      borderColor: 'success.main',
                      color: 'success.main',
                      '&:hover': {
                        borderColor: 'success.dark',
                        bgcolor: 'success.lighter'
                      }
                    }}
                  >
                    Filter
                  </Button>
                  <Button 
                    startIcon={<ReceiptIcon />}
                    variant="outlined"
                    size="small"
                    sx={{ 
                      borderRadius: 2,
                      borderColor: 'success.main',
                      color: 'success.main',
                      '&:hover': {
                        borderColor: 'success.dark',
                        bgcolor: 'success.lighter'
                      }
                    }}
                  >
                    Export
                  </Button>
                </Stack>
              </Box>
              <Divider sx={{ mb: 3 }} />

              {/* Income Stats */}
              <Grid container spacing={2} mb={3}>
                <Grid item xs={6}>
                  <Box sx={{ p: 2, bgcolor: 'success.lighter', borderRadius: 2 }}>
                    <Typography variant="body2" color="success.main">This Month</Typography>
                    <Typography variant="h6" fontWeight="bold">SAR 0.00</Typography>
                  </Box>
                </Grid>
                <Grid item xs={6}>
                  <Box sx={{ p: 2, bgcolor: 'success.lighter', borderRadius: 2 }}>
                    <Typography variant="body2" color="success.main">Last Month</Typography>
                    <Typography variant="h6" fontWeight="bold">SAR 0.00</Typography>
                  </Box>
                </Grid>
              </Grid>

              {/* Empty State */}
              <Box sx={{ textAlign: 'center', py: 4 }}>
                <IncomeIcon sx={{ fontSize: 48, color: 'success.light', mb: 2 }} />
                <Typography color="text.secondary" variant="h6">
                  No income records
                </Typography>
                <Typography color="text.disabled" variant="body2">
                  Add your first income transaction
                </Typography>
              </Box>
            </Paper>
          </Grid>

          {/* Expense Section */}
          <Grid item xs={12} md={6}>
            <Paper 
              elevation={0}
              sx={{ 
                p: 3, 
                borderRadius: 4,
                bgcolor: 'background.paper',
                border: '1px solid',
                borderColor: 'divider',
                height: '100%'
              }}
            >
              <Box 
                sx={{ 
                  display: 'flex', 
                  justifyContent: 'space-between', 
                  alignItems: 'center',
                  mb: 3,
                  flexWrap: 'wrap',
                  gap: 2
                }}
              >
                <Box display="flex" alignItems="center" gap={1}>
                  <Avatar 
                    sx={{ 
                      bgcolor: 'error.lighter',
                      color: 'error.main'
                    }}
                  >
                    <ExpenseIcon />
                  </Avatar>
                  <Typography variant="h6" fontWeight="bold">
                    Expense Details
                  </Typography>
                </Box>
                <Stack direction="row" spacing={1}>
                  <Button 
                    startIcon={<AddIcon />}
                    variant="contained"
                    size="small"
                    sx={{ 
                      borderRadius: 2,
                      bgcolor: 'error.main',
                      '&:hover': {
                        bgcolor: 'error.dark'
                      }
                    }}
                  >
                    Add
                  </Button>
                  <Button 
                    startIcon={<DateIcon />}
                    variant="outlined"
                    size="small"
                    sx={{ 
                      borderRadius: 2,
                      borderColor: 'error.main',
                      color: 'error.main',
                      '&:hover': {
                        borderColor: 'error.dark',
                        bgcolor: 'error.lighter'
                      }
                    }}
                  >
                    Filter
                  </Button>
                  <Button 
                    startIcon={<ReceiptIcon />}
                    variant="outlined"
                    size="small"
                    sx={{ 
                      borderRadius: 2,
                      borderColor: 'error.main',
                      color: 'error.main',
                      '&:hover': {
                        borderColor: 'error.dark',
                        bgcolor: 'error.lighter'
                      }
                    }}
                  >
                    Export
                  </Button>
                </Stack>
              </Box>

              <Divider sx={{ mb: 3 }} />

              {/* Expense Stats */}
              <Grid container spacing={2} mb={3}>
                <Grid item xs={6}>
                  <Box sx={{ p: 2, bgcolor: 'error.lighter', borderRadius: 2 }}>
                    <Typography variant="body2" color="error.main">This Month</Typography>
                    <Typography variant="h6" fontWeight="bold">SAR 0.00</Typography>
                  </Box>
                </Grid>
                <Grid item xs={6}>
                  <Box sx={{ p: 2, bgcolor: 'error.lighter', borderRadius: 2 }}>
                    <Typography variant="body2" color="error.main">Last Month</Typography>
                    <Typography variant="h6" fontWeight="bold">SAR 0.00</Typography>
                  </Box>
                </Grid>
              </Grid>

              {/* Empty State */}
              <Box sx={{ textAlign: 'center', py: 4 }}>
                <ExpenseIcon sx={{ fontSize: 48, color: 'error.light', mb: 2 }} />
                <Typography color="text.secondary" variant="h6">
                  No expense records
                </Typography>
                <Typography color="text.disabled" variant="body2">
                  Add your first expense transaction
                </Typography>
              </Box>
            </Paper>
          </Grid>
        </Grid>
      </Container>
    </Box>
  );
}

export default IncomeExpense; 