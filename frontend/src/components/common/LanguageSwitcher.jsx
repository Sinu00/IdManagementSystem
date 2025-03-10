import { IconButton, Menu, MenuItem, Tooltip, Avatar } from '@mui/material';
import { Language as LanguageIcon } from '@mui/icons-material';
import { useTranslation } from 'react-i18next';
import { useState } from 'react';

const LanguageSwitcher = () => {
  const { t, i18n } = useTranslation();
  const [anchorEl, setAnchorEl] = useState(null);

  const handleClick = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const changeLanguage = (lng) => {
    i18n.changeLanguage(lng);
    document.dir = lng === 'ar' ? 'rtl' : 'ltr';
    handleClose();
  };

  return (
    <>
      <Tooltip title={t('common.language')}>
        <IconButton
          onClick={handleClick}
          size="small"
          sx={{ 
            bgcolor: 'white',
            color: 'primary.main',
            '&:hover': {
              bgcolor: 'primary.lighter',
            },
            boxShadow: 1
          }}
        >
          <Avatar 
            sx={{ 
              width: 32, 
              height: 32,
              bgcolor: 'inherit',
              color: 'inherit'
            }}
          >
            <LanguageIcon />
          </Avatar>
        </IconButton>
      </Tooltip>
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleClose}
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'right',
        }}
        transformOrigin={{
          vertical: 'top',
          horizontal: 'right',
        }}
      >
        <MenuItem onClick={() => changeLanguage('en')}>
          {t('common.english')}
        </MenuItem>
        <MenuItem onClick={() => changeLanguage('ar')}>
          {t('common.arabic')}
        </MenuItem>
      </Menu>
    </>
  );
};

export default LanguageSwitcher; 