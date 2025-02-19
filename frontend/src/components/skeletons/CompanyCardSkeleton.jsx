import { Card, CardContent, Box, Skeleton, Grid } from '@mui/material';

export const CompanyCardSkeleton = () => (
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

      <Box sx={{ mt: 2 }}>
        <Grid container spacing={2}>
          <Grid item xs={6}>
            <Skeleton variant="text" width="90%" />
            <Skeleton variant="text" width="60%" />
          </Grid>
          <Grid item xs={6}>
            <Skeleton variant="text" width="90%" />
            <Skeleton variant="text" width="60%" />
          </Grid>
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