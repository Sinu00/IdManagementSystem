import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Typography,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Box,
  Alert,
  CircularProgress
} from '@mui/material';
import { mainPersonApi, companyApi } from '../services/api';
import { format } from 'date-fns';
import { useTranslation } from 'react-i18next';

const PrintAllDetails = ({ open, onClose }) => {
  const { t } = useTranslation();
  const [selectedMainPerson, setSelectedMainPerson] = useState('');
  const [mainPersons, setMainPersons] = useState([]);
  const [printData, setPrintData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchMainPersons = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await mainPersonApi.getAll();
        setMainPersons(response.data);
      } catch (error) {
        console.error('Error fetching main persons:', error);
        setError(t('errors.fetchMainPersons'));
      } finally {
        setLoading(false);
      }
    };

    if (open) {
      fetchMainPersons();
    }
  }, [open]);

  const handleMainPersonChange = async (event) => {
    const mainPersonId = event.target.value;
    setSelectedMainPerson(mainPersonId);
    
    if (mainPersonId) {
      try {
        setLoading(true);
        setError(null);
        const response = await companyApi.getByMainPerson(mainPersonId);
        setPrintData(response.data);
      } catch (error) {
        console.error('Error fetching companies:', error);
        setError(t('errors.fetchCompanies'));
      } finally {
        setLoading(false);
      }
    } else {
      setPrintData(null);
    }
  };

  const handlePrint = () => {
    const printWindow = window.open('', '_blank');
    printWindow.document.write(`
      <html>
        <head>
          <title>${t('print.title')}</title>
          <style>
            body { 
              font-family: Arial, sans-serif;
              padding: 20px;
              margin: 0;
            }
            .company-section { 
              margin-bottom: 30px; 
              page-break-inside: avoid;
            }
            .company-header { 
              background-color: #f5f5f5;
              padding: 15px;
              margin-bottom: 15px;
              border-radius: 4px;
            }
            .company-header h2 {
              margin: 0 0 10px 0;
              color: #2196f3;
            }
            .company-header p {
              margin: 0;
              color: #666;
            }
            table { 
              width: 100%;
              border-collapse: collapse;
              margin-bottom: 15px;
              font-size: 12px;
            }
            th, td { 
              border: 1px solid #ddd;
              padding: 8px;
              text-align: left;
            }
            th { 
              background-color: #f8f8f8;
              font-weight: bold;
            }
            .print-date {
              text-align: right;
              margin-bottom: 20px;
              font-size: 12px;
              color: #666;
            }
            .status-paid {
              color: #4caf50;
              font-weight: bold;
            }
            .status-pending {
              color: #f44336;
              font-weight: bold;
            }
          </style>
        </head>
        <body>
          <div class="print-date">
            ${t('print.printedOn')}: ${format(new Date(), 'dd/MM/yyyy HH:mm')}
          </div>
          ${printData?.map(company => `
            <div class="company-section">
              <div class="company-header">
                <h2>${company.name}</h2>
                <p>
                  ${t('company.crNumber')}: ${company.crNumber || 'N/A'} | 
                  ${t('company.gosiNumber')}: ${company.gosiNumber || 'N/A'} | 
                  ${t('company.molNumber')}: ${company.molNumber || 'N/A'} | 
                  ${t('company.sponserId')}: ${company.sponserId || 'N/A'}
                </p>
              </div>
              <table>
                <thead>
                  <tr>
                    <th>${t('individual.name')}</th>
                    <th>${t('individual.iqamaNumber')}</th>
                    <th>${t('individual.paidAmount')}</th>
                    <th>${t('individual.referredBy')}</th>
                    <th>${t('individual.expiryDate')}</th>
                    <th>${t('individual.paymentStatus')}</th>
                  </tr>
                </thead>
                <tbody>
                  ${company.individuals?.map(individual => `
                    <tr>
                      <td>${individual.name}</td>
                      <td>${individual.iqamaNumber}</td>
                      <td>${individual.totalPaidAmount}</td>
                      <td>${individual.referredBy || 'N/A'}</td>
                      <td>${format(new Date(individual.expiryDate), 'dd/MM/yyyy')}</td>
                      <td class="${individual.isFullyPaid ? 'status-paid' : 'status-pending'}">
                        ${individual.isFullyPaid ? t('status.fullyPaid') : t('status.pending')}
                      </td>
                    </tr>
                  `).join('') || `<tr><td colspan="6">${t('individual.noIndividuals')}</td></tr>`}
                </tbody>
              </table>
            </div>
          `).join('')}
        </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.focus();
    printWindow.print();
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>{t('print.title')}</DialogTitle>
      <DialogContent>
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        <FormControl fullWidth sx={{ mt: 2 }}>
          <InputLabel>{t('print.selectMainPerson')}</InputLabel>
          <Select
            value={selectedMainPerson}
            onChange={handleMainPersonChange}
            label={t('print.selectMainPerson')}
            disabled={loading}
          >
            <MenuItem value="">
              <em>{t('common.none')}</em>
            </MenuItem>
            {mainPersons.map((person) => (
              <MenuItem key={person._id} value={person._id}>
                {person.name}
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        {loading && (
          <Box sx={{ display: 'flex', justifyContent: 'center', mt: 3 }}>
            <CircularProgress />
          </Box>
        )}

        {!loading && printData && (
          <Box sx={{ mt: 3 }}>
            <Typography variant="h6" gutterBottom>
              {t('print.preview')}
            </Typography>
            {printData.map((company) => (
              <Paper key={company._id} sx={{ mb: 2, p: 2 }}>
                <Typography variant="h6">{company.name}</Typography>
                <Typography variant="body2" gutterBottom>
                  {t('company.crNumber')}: {company.crNumber || 'N/A'} |
                  {t('company.gosiNumber')}: {company.gosiNumber || 'N/A'} |
                  {t('company.molNumber')}: {company.molNumber || 'N/A'} |
                  {t('company.sponserId')}: {company.sponserId || 'N/A'}
                </Typography>
                <TableContainer>
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell>{t('individual.name')}</TableCell>
                        <TableCell>{t('individual.iqamaNumber')}</TableCell>
                        <TableCell>{t('individual.paidAmount')}</TableCell>
                        <TableCell>{t('individual.referredBy')}</TableCell>
                        <TableCell>{t('individual.expiryDate')}</TableCell>
                        <TableCell>{t('individual.paymentStatus')}</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {company.individuals?.map((individual) => (
                        <TableRow key={individual._id}>
                          <TableCell>{individual.name}</TableCell>
                          <TableCell>{individual.iqamaNumber}</TableCell>
                          <TableCell>{individual.totalPaidAmount}</TableCell>
                          <TableCell>{individual.referredBy || 'N/A'}</TableCell>
                          <TableCell>
                            {format(new Date(individual.expiryDate), 'dd/MM/yyyy')}
                          </TableCell>
                          <TableCell>
                            {individual.isFullyPaid ? t('status.fullyPaid') : t('status.pending')}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              </Paper>
            ))}
          </Box>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>{t('common.cancel')}</Button>
        <Button
          onClick={handlePrint}
          variant="contained"
          disabled={!selectedMainPerson || loading}
        >
          {t('common.print')}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default PrintAllDetails; 