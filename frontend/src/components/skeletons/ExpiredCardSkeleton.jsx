import { Card, CardContent, Box, Skeleton, Grid } from '@mui/material';

export const ExpiredCardSkeleton = () => (
  <Card sx={{ 
    height: '100%',
    borderRadius: 3,
    position: 'relative',
    borderWidth: 1,
    borderStyle: 'solid',
    borderColor: 'grey.200'
  }}>
    <CardContent>
      <Box display="flex" flexDirection="column" gap={2}>
        <Box display="flex" alignItems="center" gap={1}>
          <Skeleton variant="circular" width={24} height={24} />
          <Skeleton variant="text" width="60%" height={32} />
        </Box>
        
        <Box display="flex" flexDirection="column" gap={1}>
          {[...Array(3)].map((_, index) => (
            <Box key={index} display="flex" alignItems="center" gap={1}>
              <Skeleton variant="circular" width={20} height={20} />
              <Skeleton variant="text" width="70%" />
            </Box>
          ))}
        </Box>

        <Box display="flex" alignItems="center" justifyContent="space-between">
          <Skeleton variant="rectangular" width={100} height={24} sx={{ borderRadius: 1 }} />
        </Box>
      </Box>
    </CardContent>
  </Card>
);

export const ExpiredCardSkeletonList = ({ count = 6 }) => (
  <Grid container spacing={3}>
    {[...Array(count)].map((_, index) => (
      <Grid item xs={12} sm={6} md={4} key={index}>
        <ExpiredCardSkeleton />
      </Grid>
    ))}
  </Grid>
); 