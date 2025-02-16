import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Card, 
  CardContent, 
  Typography, 
  Box,
  CircularProgress,
  Alert 
} from '@mui/material';
import axios from 'axios';

const Home = () => {
  const [mainPersons, setMainPersons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchMainPersons = async () => {
      try {
        console.log('Fetching main persons...');
        const response = await axios.get('http://localhost:3000/api/main-persons');
        console.log('Response:', response.data);
        setMainPersons(response.data);
        setError(null);
      } catch (error) {
        console.error('Error fetching main persons:', error);
        setError('Failed to load data. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    fetchMainPersons();
  }, []);

  const renderContent = () => {
    if (loading) {
      return <CircularProgress size={60} />;
    }

    if (error) {
      return (
        <Alert 
          severity="error" 
          sx={{ 
            width: '100%', 
            maxWidth: '400px',
            margin: '0 auto'
          }}
        >
          {error}
        </Alert>
      );
    }

    return (
      <Box 
        sx={{ 
          display: 'flex',
          justifyContent: 'center',
          gap: '32px',
          width: '100%',
          maxWidth: '1200px'
        }}
      >
        {mainPersons.map((person) => (
          <Card 
            key={person._id}
            onClick={() => navigate(`/main-person/${person._id}/companies`)}
            sx={{ 
              cursor: 'pointer',
              transition: 'all 0.2s ease-in-out',
              '&:hover': {
                transform: 'scale(1.05)',
                boxShadow: 3
              },
              backgroundColor: '#f5f5f5',
              borderRadius: 2,
              width: '300px',
              height: '200px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            <CardContent sx={{ textAlign: 'center' }}>
              <Typography 
                variant="h4" 
                component="div" 
                gutterBottom
                sx={{ 
                  fontWeight: 500,
                  mb: 2
                }}
              >
                {person.name}
              </Typography>
              <Typography 
                color="text.secondary"
                sx={{ mb: 1 }}
              >
                {person.email}
              </Typography>
              <Typography color="text.secondary">
                {person.contactNumber}
              </Typography>
            </CardContent>
          </Card>
        ))}
      </Box>
    );
  };

  return (
    <Box 
      sx={{ 
        width: '100vw',
        height: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#ffffff'
      }}
    >
      {renderContent()}
    </Box>
  );
};

export default Home; 