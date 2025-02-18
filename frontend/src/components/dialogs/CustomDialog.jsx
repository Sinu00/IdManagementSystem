import {
  Dialog,
  DialogContent,
  DialogActions,
  Button,
  Box,
  IconButton,
  Typography,
  Alert,
  Paper,
  Stack
} from '@mui/material';
import { Close as CloseIcon } from '@mui/icons-material';

function CustomDialog({ 
  open, 
  onClose, 
  title, 
  children, 
  onSubmit, 
  submitText = 'Save',
  error,
  maxWidth = 'sm'
}) {
  return (
    <Dialog 
      open={open} 
      onClose={onClose}
      maxWidth={maxWidth}
      fullWidth
      PaperProps={{
        elevation: 0,
        sx: {
          borderRadius: 3,
          backgroundColor: 'background.paper',
          minHeight: '200px',
          maxHeight: '80vh',
          display: 'flex',
          flexDirection: 'column'
        }
      }}
    >
      <Paper 
        elevation={0} 
        sx={{ 
          background: 'linear-gradient(135deg, primary.main, primary.dark)',
          py: 2.5,
          px: 3,
          position: 'relative',
          flexShrink: 0,
          borderBottom: '1px solid',
          borderColor: 'primary.dark'
        }}
      >
        <Stack direction="row" alignItems="center" justifyContent="space-between">
          <Typography 
            variant="h6" 
            component="h2" 
            fontWeight="600"
            color="white"
          >
            {title}
          </Typography>
          <IconButton 
            onClick={onClose}
            size="small"
            sx={{ 
              color: 'white',
              bgcolor: 'rgba(255,255,255,0.1)',
              '&:hover': { 
                bgcolor: 'rgba(255,255,255,0.2)'
              }
            }}
          >
            <CloseIcon fontSize="small" />
          </IconButton>
        </Stack>
      </Paper>

      <form onSubmit={onSubmit} style={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
        <DialogContent 
          sx={{ 
            p: 3,
            flex: 1,
            overflowY: 'auto',
            '&::-webkit-scrollbar': {
              width: '6px',
              height: '6px'
            },
            '&::-webkit-scrollbar-track': {
              background: 'transparent'
            },
            '&::-webkit-scrollbar-thumb': {
              background: 'rgba(0,0,0,0.1)',
              borderRadius: '3px',
              '&:hover': {
                background: 'rgba(0,0,0,0.15)'
              }
            }
          }}
        >
          {error && (
            <Alert 
              severity="error" 
              variant="filled"
              sx={{ 
                mb: 3,
                borderRadius: 2,
                boxShadow: 1
              }}
            >
              {error}
            </Alert>
          )}
          <Stack spacing={3}>
            {children}
          </Stack>
        </DialogContent>

        <DialogActions 
          sx={{ 
            px: 3, 
            py: 2,
            bgcolor: 'grey.50',
            borderTop: '1px solid',
            borderColor: 'grey.200',
            flexShrink: 0,
            gap: 1
          }}
        >
          <Button 
            onClick={onClose}
            variant="outlined"
            size="large"
            sx={{ 
              borderRadius: 2,
              px: 3,
              borderColor: 'grey.300',
              color: 'grey.700',
              '&:hover': { 
                borderColor: 'grey.400',
                bgcolor: 'grey.50'
              }
            }}
          >
            Cancel
          </Button>
          <Button 
            type="submit" 
            variant="contained"
            size="large"
            sx={{ 
              px: 3,
              borderRadius: 2,
              boxShadow: 'none',
              '&:hover': { 
                boxShadow: 1,
                transform: 'translateY(-1px)'
              },
              transition: 'all 0.2s'
            }}
          >
            {submitText}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
}

export default CustomDialog; 