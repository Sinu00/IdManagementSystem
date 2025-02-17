import { Box, Container } from '@mui/material';

function MainLayout({ children }) {
  return (
    <Box 
      sx={{ 
        width: '100%', 
        minHeight: '100vh', 
        bgcolor: 'background.default',
        pt: 4,
        pb: 6,
        overflowX: 'hidden'
      }}
    >
      <Container maxWidth="lg">
        {children}
      </Container>
    </Box>
  );
}

export default MainLayout; 