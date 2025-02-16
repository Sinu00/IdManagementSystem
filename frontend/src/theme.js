import { createTheme } from '@mui/material/styles';

const theme = createTheme({
  palette: {
    primary: {
      main: '#1976d2',
    },
    secondary: {
      main: '#dc004e',
    },
    warning: {
      main: '#ff9800', // Orange for 10-day warning
    },
    error: {
      main: '#f44336', // Red for 5-day warning
    },
  },
});

export default theme; 