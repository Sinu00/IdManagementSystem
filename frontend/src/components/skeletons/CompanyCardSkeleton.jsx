import { Card, CardContent, Box, Skeleton, Grid, Avatar, Divider } from '@mui/material';
import {
  Business as BusinessIcon,
  Person as PersonIcon,
  Error as ErrorIcon,
  LocationOn as LocationIcon,
} from '@mui/icons-material';

export const CompanyCardSkeleton = () => (
  <Card 
    sx={{ 
      height: '100%',
      borderRadius: 3,
      position: 'relative',
      opacity: 0.7
    }}
  >
    <Box sx={{ height: 6, bgcolor: 'grey.300', width: '100%' }} />
    <CardContent sx={{ p: 3 }}>
      {/* Header Section */}
      <Box display="flex" alignItems="center" gap={1} mb={2}>
        <Box flex={1} sx={{ direction: 'rtl', textAlign: 'right' }}>
          <Skeleton 
            variant="text" 
            width="90%" 
            sx={{ 
              height: '32px',
              ml: 'auto',
              borderRadius: '4px'
            }} 
          />
          <Skeleton 
            variant="text" 
            width="60%" 
            sx={{ 
              height: '20px',
              ml: 'auto',
              mt: 0.5,
              borderRadius: '4px'
            }} 
          />
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
          <Box display="flex" alignItems="center" gap={1}>
            <BusinessIcon sx={{ fontSize: 16, color: 'grey.400' }} />
            <Skeleton variant="text" width="80%" sx={{ height: '20px' }} />
          </Box>
          <Box display="flex" alignItems="center" gap={1} mt={1}>
            <PersonIcon sx={{ fontSize: 16, color: 'grey.400' }} />
            <Skeleton variant="text" width="70%" sx={{ height: '20px' }} />
          </Box>
        </Grid>
        <Grid item xs={6}>
          <Box display="flex" alignItems="center" gap={1}>
            <ErrorIcon sx={{ fontSize: 16, color: 'grey.400' }} />
            <Skeleton variant="text" width="80%" sx={{ height: '20px' }} />
          </Box>
          <Box display="flex" alignItems="center" gap={1} mt={1}>
            <LocationIcon sx={{ fontSize: 16, color: 'grey.400' }} />
            <Skeleton variant="text" width="70%" sx={{ height: '20px' }} />
          </Box>
        </Grid>
      </Grid>

      {/* Status Cards */}
      <Box sx={{ mt: 3 }}>
        <Grid container spacing={2}>
          {['error', 'warning', 'success'].map((color) => (
            <Grid item xs={4} key={color}>
              <Box
                sx={{ 
                  p: 1.5, 
                  bgcolor: `${color}.lighter`,
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
                    bgcolor: `${color}.main`
                  }
                }}
              >
                <Skeleton variant="text" width={40} sx={{ height: '40px' }} />
                <Skeleton variant="text" width={60} sx={{ height: '16px' }} />
              </Box>
            </Grid>
          ))}
        </Grid>
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