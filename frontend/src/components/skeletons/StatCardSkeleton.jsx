import { Card, CardContent, Box, Skeleton, Grid, Paper } from '@mui/material';

export const StatCardSkeleton = () => (
  <Paper 
    elevation={0}
    sx={{ 
      p: { xs: 1.5, sm: 3 },
      height: '100%',
      borderRadius: { 
        xs: 'inherit',
        sm: 3 
      },
      bgcolor: 'grey.100',
      position: 'relative',
      overflow: 'hidden'
    }}
  >
    <Box 
      sx={{ 
        position: 'absolute',
        top: 0,
        right: 0,
        p: { xs: 1, sm: 2 },
        opacity: 0.1
      }}
    >
      <Skeleton variant="circular" width={{ xs: 32, sm: 80 }} height={{ xs: 32, sm: 80 }} />
    </Box>
    <Box display="flex" flexDirection="column" gap={0.5}>
      <Skeleton 
        variant="text" 
        width={100} 
        height={{ xs: 30, sm: 60 }}
        sx={{ 
          fontSize: { xs: '1.25rem', sm: '2.5rem' }
        }}
      />
      <Skeleton 
        variant="text" 
        width={80}
        height={24}
        sx={{ 
          fontSize: { xs: '0.7rem', sm: '1rem' }
        }}
      />
    </Box>
  </Paper>
);

export const StatCardSkeletonList = () => (
  <Grid container spacing={{ xs: 0, sm: 3 }}>
    <Grid item xs={4} sm={4}>
      <Paper 
        elevation={0}
        sx={{ 
          borderRadius: { 
            xs: '10px 0 0 10px',
            sm: 3 
          }
        }}
      >
        <StatCardSkeleton />
      </Paper>
    </Grid>
    <Grid item xs={4} sm={4}>
      <Paper 
        elevation={0}
        sx={{ 
          borderRadius: { 
            xs: 0,
            sm: 3 
          }
        }}
      >
        <StatCardSkeleton />
      </Paper>
    </Grid>
    <Grid item xs={4} sm={4}>
      <Paper 
        elevation={0}
        sx={{ 
          borderRadius: { 
            xs: '0 10px 10px 0',
            sm: 3 
          }
        }}
      >
        <StatCardSkeleton />
      </Paper>
    </Grid>
  </Grid>
); 