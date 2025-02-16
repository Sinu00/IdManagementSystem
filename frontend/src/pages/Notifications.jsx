import { useState, useEffect } from 'react';
import {
  Container,
  Typography,
  Box,
  CircularProgress,
  Card,
  CardContent,
  Grid,
} from '@mui/material';
import { notificationApi } from '../services/api';
import { format } from 'date-fns';

function Notifications() {
  const [expiringIds, setExpiringIds] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchExpiringIds = async () => {
      try {
        const response = await notificationApi.getExpiring();
        setExpiringIds(response.data);
      } catch (error) {
        console.error('Error fetching expiring IDs:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchExpiringIds();
  }, []);

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="80vh">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Typography variant="h4" component="h1" gutterBottom>
        Expiring ID Cards
      </Typography>

      <Grid container spacing={3}>
        {expiringIds.map((individual) => (
          <Grid item xs={12} sm={6} md={4} key={individual._id}>
            <Card sx={{ 
              borderColor: individual.alertLevel === 'red' ? 'error.main' : 'warning.main',
              borderWidth: 1,
              borderStyle: 'solid'
            }}>
              <CardContent>
                <Typography variant="h6" component="h2">
                  {individual.name}
                </Typography>
                <Typography color="text.secondary">
                  Company: {individual.company.name}
                </Typography>
                <Typography color="text.secondary">
                  Main Person: {individual.company.mainPerson.name}
                </Typography>
                <Typography color="text.secondary">
                  ID: {individual.idNumber}
                </Typography>
                <Typography color="text.secondary">
                  Expires: {format(new Date(individual.expiryDate), 'dd/MM/yyyy')}
                </Typography>
                <Typography 
                  color={individual.alertLevel === 'red' ? 'error' : 'warning'}
                  sx={{ mt: 1, fontWeight: 'bold' }}
                >
                  Expires in {individual.daysUntilExpiry} days
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>
    </Container>
  );
}

export default Notifications; 