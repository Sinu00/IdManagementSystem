import { Box } from '@mui/material';
import { useTranslation } from 'react-i18next';

const AppLayout = ({ children }) => {
  const { t } = useTranslation();

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <Box component="main" sx={{ flexGrow: 1 }}>
        {children}
      </Box>
    </Box>
  );
};

export default AppLayout; 