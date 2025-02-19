import { Card, CardContent, Box, Skeleton, Grid } from '@mui/material';

export const StatCardSkeleton = () => (
  <Card sx={{ 
    height: '100%',
    borderRadius: 3,
    position: 'relative',
    minWidth: { xs: '100%', sm: 220 }
  }}>
    <CardContent sx={{ p: 3 }}>
      <Box display="flex" alignItems="center" gap={2}>
        <Skeleton variant="circular" width={40} height={40} />
        <Box flex={1}>
          <Skeleton variant="text" width="60%" height={24} />
          <Skeleton variant="text" width="40%" height={20} />
        </Box>
      </Box>
      <Box mt={2}>
        <Skeleton variant="text" width="80%" height={28} />
      </Box>
    </CardContent>
  </Card>
);

export const StatCardSkeletonList = () => (
  <Grid container spacing={3}>
    {[...Array(3)].map((_, index) => (
      <Grid item xs={12} sm={6} md={4} key={index}>
        <StatCardSkeleton />
      </Grid>
    ))}
  </Grid>
); 