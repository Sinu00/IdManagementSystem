import { Box, CircularProgress, Typography } from '@mui/material';

function LoadingScreen({ message = 'Loading...' }) {
  return (
    <Box 
      sx={{ 
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '80vh',
        gap: 2
      }}
    >
      <CircularProgress />
      <Typography color="textSecondary">{message}</Typography>
    </Box>
  );
}

export default LoadingScreen; 