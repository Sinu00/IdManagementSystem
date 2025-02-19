import { Card, CardContent, Box, Skeleton, Grid } from '@mui/material';

export const IndividualCardSkeleton = () => (
  <Card sx={{ 
    height: '100%',
    borderRadius: 3,
    position: 'relative'
  }}>
    <Box sx={{ height: 6, bgcolor: 'grey.200', width: '100%' }} />
    <CardContent sx={{ p: 3 }}>
      <Box display="flex" alignItems="center" gap={2} mb={2}>
        <Skeleton variant="circular" width={48} height={48} />
        <Box flex={1}>
          <Skeleton variant="text" width="70%" height={24} />
          <Skeleton variant="text" width="40%" height={20} />
        </Box>
      </Box>

      <Skeleton variant="rectangular" height={1} sx={{ my: 2 }} />

      <Box sx={{ mt: 2 }}>
        <Grid container spacing={1}>
          {[...Array(5)].map((_, index) => (
            <Grid item xs={12} key={index}>
              <Box display="flex" alignItems="center" gap={1}>
                <Skeleton variant="circular" width={16} height={16} />
                <Skeleton variant="text" width="80%" />
              </Box>
            </Grid>
          ))}
        </Grid>
      </Box>
    </CardContent>
  </Card>
);

export const IndividualCardSkeletonList = ({ count = 8 }) => (
  <Grid container spacing={3}>
    {[...Array(count)].map((_, index) => (
      <Grid item xs={12} sm={6} md={3} key={index}>
        <IndividualCardSkeleton />
      </Grid>
    ))}
  </Grid>
); 