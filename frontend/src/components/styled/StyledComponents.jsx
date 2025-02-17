import { styled } from '@mui/material/styles';
import { Card, Paper, TableCell, TableRow } from '@mui/material';

export const StyledCard = styled(Card)(({ theme }) => ({
  height: '100%',
  transition: 'transform 0.2s, box-shadow 0.2s',
  borderRadius: theme.shape.borderRadius * 2,
  '&:hover': {
    transform: 'translateY(-4px)',
    boxShadow: theme.shadows[8],
  },
}));

export const StyledHeaderCard = styled(Paper)(({ theme }) => ({
  padding: theme.spacing(3),
  marginBottom: theme.spacing(4),
  borderRadius: theme.shape.borderRadius * 2,
  backgroundColor: theme.palette.primary.light,
  color: theme.palette.primary.dark,
}));

export const StyledTableRow = styled(TableRow)(({ theme }) => ({
  '&:nth-of-type(odd)': {
    backgroundColor: theme.palette.action.hover,
  },
  '&:hover': {
    backgroundColor: theme.palette.action.selected,
  },
}));

export const StyledTableCell = styled(TableCell)(({ theme }) => ({
  padding: theme.spacing(2),
})); 