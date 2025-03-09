import { Card, CardContent, Box, Skeleton, Grid, Avatar, Divider, Stack, Button } from '@mui/material';
import {
  Business as BusinessIcon,
  Person as PersonIcon,
  Error as ErrorIcon,
  LocationOn as LocationIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Payment as PaymentIcon,
  Cached as CachedIcon,
} from '@mui/icons-material';

export const CompanyCardSkeleton = () => (
  <Card 
    sx={{ 
      height: '100%',
      borderRadius: 3,
      position: 'relative',
      opacity: 0.7,
      cursor: 'pointer',
      transition: 'all 0.3s ease-in-out',
    }}
  >
    <Box sx={{ height: 6, bgcolor: 'grey.300', width: '100%' }} />
    <CardContent sx={{ p: 3 }}>
      {/* Payment Status Indicator */}
      <Box
        sx={{
          position: 'absolute',
          top: 12,
          left: 12,
          width: 12,
          height: 12,
          borderRadius: '50%',
          bgcolor: 'grey.300',
          border: '2px solid',
          borderColor: 'background.paper',
          boxShadow: 1,
          zIndex: 1
        }}
      />

      {/* Header Section */}
      <Box display="flex" alignItems="center" gap={1} mb={2}>
        <Box flex={1}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
            <Skeleton 
              variant="text" 
              width="90%" 
              sx={{ 
                height: '32px',
                borderRadius: '4px'
              }} 
            />
          </Box>
        </Box>
        <Avatar 
          sx={{ 
            bgcolor: 'grey.200',
            width: 56,
            height: 56
          }}
        >
          <BusinessIcon fontSize="large" sx={{ color: 'grey.400' }} />
        </Avatar>
      </Box>

      <Divider sx={{ my: 2 }} />

      {/* Company Details Grid */}
      <Grid container spacing={2}>
        <Grid item xs={6}>
          <Box display="flex" alignItems="center" gap={1} mb={1}>
            <BusinessIcon sx={{ fontSize: 16, color: 'grey.400' }} />
            <Skeleton variant="text" width="80%" height={20} />
          </Box>
          <Box display="flex" alignItems="center" gap={1}>
            <PersonIcon sx={{ fontSize: 16, color: 'grey.400' }} />
            <Skeleton variant="text" width="70%" height={20} />
          </Box>
        </Grid>
        <Grid item xs={6}>
          <Box display="flex" alignItems="center" gap={1} mb={1}>
            <ErrorIcon sx={{ fontSize: 16, color: 'grey.400' }} />
            <Skeleton variant="text" width="80%" height={20} />
          </Box>
          <Box display="flex" alignItems="center" gap={1}>
            <LocationIcon sx={{ fontSize: 16, color: 'grey.400' }} />
            <Skeleton variant="text" width="70%" height={20} />
          </Box>
        </Grid>
      </Grid>

      {/* Status Cards */}
      <Box sx={{ mt: 3 }}>
        <Grid container spacing={2}>
          <Grid item xs={4}>
            <Box
              sx={{ 
                p: 1.5, 
                bgcolor: 'error.lighter',
                borderRadius: 2,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                position: 'relative',
                overflow: 'hidden',
                '&::before': {
                  content: '""',
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  width: '100%',
                  height: '2px',
                  bgcolor: 'error.main'
                }
              }}
            >
              <Skeleton variant="text" width={30} height={32} />
              <Skeleton variant="text" width={40} height={16} />
            </Box>
          </Grid>

          <Grid item xs={4}>
            <Box
              sx={{ 
                p: 1.5, 
                bgcolor: 'warning.lighter',
                borderRadius: 2,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                position: 'relative',
                overflow: 'hidden',
                '&::before': {
                  content: '""',
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  width: '100%',
                  height: '2px',
                  bgcolor: 'warning.main'
                }
              }}
            >
              <Skeleton variant="text" width={30} height={32} />
              <Skeleton variant="text" width={40} height={16} />
            </Box>
          </Grid>

          <Grid item xs={4}>
            <Box
              sx={{ 
                p: 1.5, 
                bgcolor: 'success.lighter',
                borderRadius: 2,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                position: 'relative',
                overflow: 'hidden',
                '&::before': {
                  content: '""',
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  width: '100%',
                  height: '2px',
                  bgcolor: 'success.main'
                }
              }}
            >
              <Skeleton variant="text" width={30} height={32} />
              <Skeleton variant="text" width={40} height={16} />
            </Box>
          </Grid>
        </Grid>
      </Box>

      {/* Action Buttons */}
      <Box 
        sx={{ 
          mt: 2,
          display: 'flex',
          gap: 0.75,
          '& .MuiButton-root': {
            flex: 1,
            minWidth: 'auto'
          }
        }}
      >
        <Button
          size="small"
          sx={{ 
            bgcolor: 'background.paper',
            boxShadow: 1,
          }}
        >
          <Skeleton variant="rectangular" width={60} height={24} />
        </Button>
        <Button
          size="small"
          sx={{ 
            bgcolor: 'background.paper',
            boxShadow: 1,
          }}
        >
          <Skeleton variant="rectangular" width={60} height={24} />
        </Button>
        <Button
          size="small"
          sx={{ 
            bgcolor: 'background.paper',
            boxShadow: 1,
          }}
        >
          <Skeleton variant="rectangular" width={60} height={24} />
        </Button>
        <Button
          size="small"
          sx={{ 
            bgcolor: 'background.paper',
            boxShadow: 1,
          }}
        >
          <Skeleton variant="rectangular" width={60} height={24} />
        </Button>
      </Box>
    </CardContent>
  </Card>
);

export const CompanyCardSkeletonList = ({ count = 6 }) => (
  <Grid container spacing={3}>
    {[...Array(count)].map((_, index) => (
      <Grid item xs={12} sm={6} md={4} key={index}>
        <CompanyCardSkeleton />
      </Grid>
    ))}
  </Grid>
); 