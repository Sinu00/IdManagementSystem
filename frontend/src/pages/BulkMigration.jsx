import React, { useState, useEffect } from 'react';
import {
  Box,
  Button,
  Card,
  CardContent,
  Container,
  FormControl,
  Grid,
  IconButton,
  InputLabel,
  MenuItem,
  Select,
  TextField,
  Typography,
  Alert,
  Autocomplete,
} from '@mui/material';
import { Add as AddIcon, Delete as DeleteIcon } from '@mui/icons-material';
import { useAuth } from '../context/AuthContext';
import { companyApi, mainPersonApi, userApi } from '../services/api';
import { toast } from 'react-hot-toast';

const NATIONALITIES = [
  'Indian',
  'Pakistan',
  'Bangladesh',
  'Sudan',
  'Nepal',
  'Philippines',
  '.'
];

const emptyCompany = {
  name: '',
  crNumber: '',
  sponserId: '',
  gosiNumber: '',
  molNumber: '',
  crAmount: '',
  qiwaAmount: '',
  muqeemAmount: '',
  efaAmount: '',
  saudiAmount: '',
  individuals: []
};

const emptyIndividual = {
  name: '',
  nationality: '',
  phoneNumber: '',
  iqamaNumber: '',
  description: '',
  expiryDate: null,
  referredBy: '',
  amount: '',
  iqamaPrice: 5000
};

const formatDate = (input) => {
  if (!input) return { display: '', backend: null, isValid: true };
  
  const inputStr = String(input);
  
  // If the input already contains separators
  if (inputStr.includes('-') || inputStr.includes('/')) {
    // Handle pasted dates (either DD-MM-YYYY or YYYY-MM-DD)
    const datePattern = /^(\d{2})[-/](\d{2})[-/](\d{4})$|^(\d{4})[-/](\d{2})[-/](\d{2})$/;
    const match = inputStr.match(datePattern);
    // ...rest of the existing pasted date handling...
  }

  // Handle direct typing (numbers only)
  const digits = inputStr.replace(/\D/g, '');
  let display = digits;

  // Format with hyphens while typing
  if (digits.length > 4) {
    // Format: DD-MM-YYYY
    display = `${digits.slice(0, 2)}-${digits.slice(2, 4)}-${digits.slice(4, 8)}`;
  } else if (digits.length > 2) {
    // Format: DD-MM
    display = `${digits.slice(0, 2)}-${digits.slice(2)}`;
  } else {
    // Just the day part
    display = digits;
  }

  // Only validate if we have a complete date
  if (digits.length === 8) {
    const day = parseInt(digits.slice(0, 2), 10);
    const month = parseInt(digits.slice(2, 4), 10);
    const year = parseInt(digits.slice(4, 8), 10);

    if (month >= 1 && month <= 12 && day >= 1 && day <= 31 && year >= 2000 && year <= 2100) {
      return {
        display: `${digits.slice(0, 2)}-${digits.slice(2, 4)}-${digits.slice(4, 8)}`,
        backend: `${year}-${month.toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`,
        isValid: true
      };
    }
    return { display, backend: null, isValid: false };
  }

  return { display, backend: null, isValid: digits.length < 8 };
};

const BulkMigration = () => {
  const [mainPersons, setMainPersons] = useState([]);
  const [users, setUsers] = useState([]);
  const { user } = useAuth();
  const [selectedMainPerson, setSelectedMainPerson] = useState('');
  const [companies, setCompanies] = useState([{ ...emptyCompany }]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [mainPersonsRes, usersRes] = await Promise.all([
          mainPersonApi.getAll(),
          userApi.getAll()
        ]);
        setMainPersons(mainPersonsRes.data);
        setUsers(usersRes.data);
      } catch (err) {
        setError('Failed to fetch data');
        toast.error('Failed to load required data');
      }
    };

    fetchData();
  }, []);

  const handleMainPersonChange = (event) => {
    setSelectedMainPerson(event.target.value);
  };

  const handleAddCompany = () => {
    setCompanies([...companies, { ...emptyCompany }]);
  };

  const handleRemoveCompany = (companyIndex) => {
    setCompanies(companies.filter((_, index) => index !== companyIndex));
  };

  const handleCompanyChange = (companyIndex, field, value) => {
    const updatedCompanies = [...companies];
    updatedCompanies[companyIndex] = {
      ...updatedCompanies[companyIndex],
      [field]: value
    };
    setCompanies(updatedCompanies);
  };

  const handleAddIndividual = (companyIndex) => {
    const updatedCompanies = [...companies];
    updatedCompanies[companyIndex].individuals = [
      ...(updatedCompanies[companyIndex].individuals || []),
      { ...emptyIndividual }
    ];
    setCompanies(updatedCompanies);
  };

  const handleRemoveIndividual = (companyIndex, individualIndex) => {
    const updatedCompanies = [...companies];
    updatedCompanies[companyIndex].individuals = updatedCompanies[companyIndex].individuals.filter(
      (_, index) => index !== individualIndex
    );
    setCompanies(updatedCompanies);
  };

  const handleIndividualChange = (companyIndex, individualIndex, field, value) => {
    const updatedCompanies = [...companies];
    updatedCompanies[companyIndex].individuals[individualIndex] = {
      ...updatedCompanies[companyIndex].individuals[individualIndex],
      [field]: value
    };
    setCompanies(updatedCompanies);
  };

  const validateData = () => {
    // Validate main person selection
    if (!selectedMainPerson) {
      throw new Error('Please select a main person');
    }

    // Validate companies
    if (companies.length === 0) {
      throw new Error('Please add at least one company');
    }

    const iqamaNumbers = new Set();

    companies.forEach((company, companyIndex) => {
      // Company required fields
      if (!company.name?.trim()) {
        throw new Error(`Company ${companyIndex + 1}: Name is required`);
      }

      // Validate amount fields are numbers or empty
      ['crAmount', 'qiwaAmount', 'muqeemAmount', 'efaAmount', 'saudiAmount'].forEach(field => {
        if (company[field] !== '' && (isNaN(company[field]) || company[field] < 0)) {
          throw new Error(`Company ${companyIndex + 1}: ${field} must be a valid number`);
        }
      });

      // Validate individuals if present
      if (company.individuals?.length > 0) {
        company.individuals.forEach((individual, individualIndex) => {
          // Check required fields
          if (!individual.name?.trim()) {
            throw new Error(`Company ${companyIndex + 1}, Individual ${individualIndex + 1}: Name is required`);
          }
          if (!individual.nationality?.trim()) {
            throw new Error(`Company ${companyIndex + 1}, Individual ${individualIndex + 1}: Nationality is required`);
          }
          if (!individual.iqamaNumber?.trim()) {
            throw new Error(`Company ${companyIndex + 1}, Individual ${individualIndex + 1}: Iqama number is required`);
          }
          if (!individual.expiryDate?.value && !formatDate(individual.expiryDate)?.backend) {
            throw new Error(`Company ${companyIndex + 1}, Individual ${individualIndex + 1}: Valid expiry date is required`);
          }

          // Check for duplicate iqama numbers
          if (iqamaNumbers.has(individual.iqamaNumber)) {
            throw new Error(`Company ${companyIndex + 1}, Individual ${individualIndex + 1}: Duplicate Iqama number ${individual.iqamaNumber}`);
          }
          iqamaNumbers.add(individual.iqamaNumber);

          // Validate iqamaPrice
          if (!individual.iqamaPrice || individual.iqamaPrice < 0) {
            throw new Error(`Company ${companyIndex + 1}, Individual ${individualIndex + 1}: Invalid Iqama price`);
          }

          // Validate amount is a number or empty
          if (individual.amount !== '' && (isNaN(individual.amount) || individual.amount < 0)) {
            throw new Error(`Company ${companyIndex + 1}, Individual ${individualIndex + 1}: Amount must be a valid number`);
          }
        });
      }
    });
  };

  const handleSubmit = async () => {
    try {
      setLoading(true);
      setError('');

      // Run all validations
      validateData();

      // Clean the data before sending
      const cleanedCompanies = companies.map(company => ({
        ...company,
        crAmount: company.crAmount === '' ? 0 : Number(company.crAmount),
        qiwaAmount: company.qiwaAmount === '' ? 0 : Number(company.qiwaAmount),
        muqeemAmount: company.muqeemAmount === '' ? 0 : Number(company.muqeemAmount),
        efaAmount: company.efaAmount === '' ? 0 : Number(company.efaAmount),
        saudiAmount: company.saudiAmount === '' ? 0 : Number(company.saudiAmount),
        individuals: company.individuals?.map(individual => ({
          ...individual,
          expiryDate: individual.expiryDate?.value || formatDate(individual.expiryDate)?.backend || null,
          amount: individual.amount === '' ? 0 : Number(individual.amount),
          iqamaPrice: Number(individual.iqamaPrice) || 5000
        }))
      }));

      await companyApi.bulkMigrate({
        mainPersonId: selectedMainPerson,
        companies: cleanedCompanies
      });

      toast.success('Data migrated successfully!');
      setCompanies([{ ...emptyCompany }]);
      setSelectedMainPerson('');
    } catch (error) {
      const errorMessage = error.response?.data?.message || error.message;
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (event) => {
    if (event.key === 'Enter' && (event.ctrlKey || event.metaKey) && !loading) {
      handleSubmit();
    }
  };

  return (
    <Container 
      maxWidth="lg" 
      sx={{ mt: 4, mb: 4 }}
      onKeyDown={handleKeyDown}
      tabIndex={0} // Makes the container focusable
    >
      <Typography variant="h4" gutterBottom>
        Bulk Data Migration
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      <Box sx={{ bgcolor: 'background.paper', borderRadius: 1, p: 3, border: '1px solid', borderColor: 'divider' }}>
        <Grid container spacing={3}>
          <Grid item xs={12}>
            <FormControl fullWidth>
              <InputLabel>Select Main Person</InputLabel>
              <Select
                value={selectedMainPerson}
                onChange={handleMainPersonChange}
                label="Select Main Person"
              >
                {mainPersons.map((person) => (
                  <MenuItem key={person._id} value={person._id}>
                    {person.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>

          {companies.map((company, companyIndex) => (
            <Grid item xs={12} key={companyIndex}>
              <Box sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 1, p: 3 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                  <Typography variant="h6">Company {companyIndex + 1}</Typography>
                  {companies.length > 1 && (
                    <IconButton
                      onClick={() => handleRemoveCompany(companyIndex)}
                      color="error"
                    >
                      <DeleteIcon />
                    </IconButton>
                  )}
                </Box>

                <Grid container spacing={2}>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      label="Company Name"
                      value={company.name}
                      onChange={(e) => handleCompanyChange(companyIndex, 'name', e.target.value)}
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      label="CR Number"
                      value={company.crNumber}
                      onChange={(e) => handleCompanyChange(companyIndex, 'crNumber', e.target.value)}
                    />
                  </Grid>
                  <Grid item xs={12} sm={4}>
                    <TextField
                      fullWidth
                      label="Sponsor ID"
                      value={company.sponserId}
                      onChange={(e) => handleCompanyChange(companyIndex, 'sponserId', e.target.value)}
                    />
                  </Grid>
                  <Grid item xs={12} sm={4}>
                    <TextField
                      fullWidth
                      label="GOSI Number"
                      value={company.gosiNumber}
                      onChange={(e) => handleCompanyChange(companyIndex, 'gosiNumber', e.target.value)}
                    />
                  </Grid>
                  <Grid item xs={12} sm={4}>
                    <TextField
                      fullWidth
                      label="MOL Number"
                      value={company.molNumber}
                      onChange={(e) => handleCompanyChange(companyIndex, 'molNumber', e.target.value)}
                    />
                  </Grid>

                  {/* Amount Fields */}
                  <Grid item xs={12}>
                    <Typography variant="subtitle2" sx={{ mb: 2, mt: 1 }}>Company Amounts</Typography>
                  </Grid>
                  <Grid item xs={12} sm={4}>
                    <TextField
                      fullWidth
                      type="number"
                      label="CR Amount"
                      value={company.crAmount}
                      onChange={(e) => handleCompanyChange(companyIndex, 'crAmount', e.target.value === '' ? '' : parseFloat(e.target.value))}
                    />
                  </Grid>
                  <Grid item xs={12} sm={4}>
                    <TextField
                      fullWidth
                      type="number"
                      label="Qiwa Amount"
                      value={company.qiwaAmount}
                      onChange={(e) => handleCompanyChange(companyIndex, 'qiwaAmount', e.target.value === '' ? '' : parseFloat(e.target.value))}
                    />
                  </Grid>
                  <Grid item xs={12} sm={4}>
                    <TextField
                      fullWidth
                      type="number"
                      label="Muqeem Amount"
                      value={company.muqeemAmount}
                      onChange={(e) => handleCompanyChange(companyIndex, 'muqeemAmount', e.target.value === '' ? '' : parseFloat(e.target.value))}
                    />
                  </Grid>
                  <Grid item xs={12} sm={4}>
                    <TextField
                      fullWidth
                      type="number"
                      label="EFA Amount"
                      value={company.efaAmount}
                      onChange={(e) => handleCompanyChange(companyIndex, 'efaAmount', e.target.value === '' ? '' : parseFloat(e.target.value))}
                    />
                  </Grid>
                  <Grid item xs={12} sm={4}>
                    <TextField
                      fullWidth
                      type="number"
                      label="Saudi Amount"
                      value={company.saudiAmount}
                      onChange={(e) => handleCompanyChange(companyIndex, 'saudiAmount', e.target.value === '' ? '' : parseFloat(e.target.value))}
                    />
                  </Grid>
                </Grid>

                <Box sx={{ mt: 3 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                    <Typography variant="subtitle1">Individuals (Optional)</Typography>
                    <Button
                      startIcon={<AddIcon />}
                      onClick={() => handleAddIndividual(companyIndex)}
                      size="small"
                    >
                      Add Individual
                    </Button>
                  </Box>
                  
                  {(!company.individuals || company.individuals.length === 0) && (
                    <Typography 
                      variant="body2" 
                      color="text.secondary"
                      sx={{ 
                        fontStyle: 'italic',
                        mb: 2,
                        textAlign: 'center',
                        p: 2,
                        bgcolor: 'action.hover',
                        borderRadius: 1
                      }}
                    >
                      No individuals added yet. You can add individuals or leave it empty.
                    </Typography>
                  )}

                  {company.individuals?.map((individual, individualIndex) => (
                    <Box 
                      key={individualIndex} 
                      sx={{ 
                        mt: 2,
                        border: '1px solid',
                        borderColor: 'divider',
                        borderRadius: 1,
                        p: 3
                      }}
                    >
                      <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
                        <IconButton
                          onClick={() => handleRemoveIndividual(companyIndex, individualIndex)}
                          color="error"
                          size="small"
                        >
                          <DeleteIcon />
                        </IconButton>
                      </Box>
                      <Grid container spacing={2}>
                        <Grid item xs={12} sm={6}>
                          <TextField
                            fullWidth
                            label="Name"
                            value={individual.name}
                            onChange={(e) => handleIndividualChange(companyIndex, individualIndex, 'name', e.target.value)}
                          />
                        </Grid>
                        <Grid item xs={12} sm={6}>
                          <Autocomplete
                            fullWidth
                            freeSolo
                            options={NATIONALITIES}
                            value={individual.nationality}
                            onChange={(_, newValue) => handleIndividualChange(companyIndex, individualIndex, 'nationality', newValue)}
                            renderInput={(params) => (
                              <TextField 
                                {...params} 
                                label="Nationality"
                              />
                            )}
                          />
                        </Grid>
                        <Grid item xs={12} sm={6}>
                          <TextField
                            fullWidth
                            label="Phone Number"
                            value={individual.phoneNumber}
                            onChange={(e) => handleIndividualChange(companyIndex, individualIndex, 'phoneNumber', e.target.value)}
                          />
                        </Grid>
                        <Grid item xs={12}>
                          <TextField
                            fullWidth
                            label="Description"
                            value={individual.description}
                            onChange={(e) => handleIndividualChange(companyIndex, individualIndex, 'description', e.target.value)}
                            multiline
                            rows={3}
                          />
                        </Grid>
                        <Grid item xs={12} sm={6}>
                          <TextField
                            fullWidth
                            label="Iqama Number"
                            value={individual.iqamaNumber}
                            onChange={(e) => handleIndividualChange(companyIndex, individualIndex, 'iqamaNumber', e.target.value)}
                          />
                        </Grid>
                        <Grid item xs={12} sm={6}>
                          <TextField
                            fullWidth
                            label="Expiry Date"
                            value={individual.expiryDate?.display || individual.expiryDate || ''}
                            onChange={(e) => {
                              const result = formatDate(e.target.value);
                              handleIndividualChange(companyIndex, individualIndex, 'expiryDate', 
                                result.backend ? { display: result.display, value: result.backend } : result.display
                              );
                            }}
                            error={individual.expiryDate && !formatDate(individual.expiryDate)?.isValid}
                            helperText={
                              individual.expiryDate && !formatDate(individual.expiryDate)?.isValid
                                ? "Invalid date. Use DD-MM-YYYY format"
                                : "Format: DD-MM-YYYY"
                            }
                            placeholder="DD-MM-YYYY"
                          />
                        </Grid>
                        <Grid item xs={12} sm={6}>
                          <FormControl fullWidth>
                            <InputLabel>Referred By</InputLabel>
                            <Select
                              value={individual.referredBy}
                              onChange={(e) => handleIndividualChange(companyIndex, individualIndex, 'referredBy', e.target.value)}
                              label="Referred By"
                            >
                              {users.map((user) => (
                                <MenuItem key={user._id} value={user.username}>
                                  {user.username}
                                </MenuItem>
                              ))}
                            </Select>
                          </FormControl>
                        </Grid>
                        <Grid item xs={12} sm={6}>
                          <TextField
                            fullWidth
                            type="number"
                            label="Amount"
                            value={individual.amount}
                            onChange={(e) => handleIndividualChange(companyIndex, individualIndex, 'amount', e.target.value === '' ? '' : parseFloat(e.target.value))}
                          />
                        </Grid>
                        <Grid item xs={12} sm={6}>
                          <TextField
                            fullWidth
                            type="number"
                            label="Iqama Price"
                            value={individual.iqamaPrice}
                            onChange={(e) => handleIndividualChange(companyIndex, individualIndex, 'iqamaPrice', parseFloat(e.target.value))}
                          />
                        </Grid>
                      </Grid>
                    </Box>
                  ))}
                </Box>
              </Box>
            </Grid>
          ))}

          <Grid item xs={12}>
            <Button
              startIcon={<AddIcon />}
              onClick={handleAddCompany}
              sx={{ mr: 2 }}
            >
              Add Company
            </Button>
            <Button
              variant="contained"
              onClick={handleSubmit}
              disabled={loading}
            >
              Submit Migration
            </Button>
          </Grid>
        </Grid>
      </Box>
    </Container>
  );
};

export default BulkMigration;