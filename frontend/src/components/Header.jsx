import { useState } from 'react';
import {
  AppBar,
  Toolbar,
  Typography,
  Box,
  IconButton,
  Avatar,
  Menu,
  MenuItem,
  Divider,
  ListItemIcon,
  Chip,
} from '@mui/material';
import HistoryIcon from '@mui/icons-material/History';
import LogoutIcon from '@mui/icons-material/Logout';
import AdminPanelSettingsIcon from '@mui/icons-material/AdminPanelSettings';
import CreateIcon from '@mui/icons-material/Create';
import VisibilityIcon from '@mui/icons-material/Visibility';

function Header({ user, onOpenActivityLog, onLogout }) {
  const [userMenuAnchor, setUserMenuAnchor] = useState(null);

  const getRoleInfo = () => {
    switch (user.role) {
      case 'admin':
        return { label: 'Admin', color: 'error', icon: <AdminPanelSettingsIcon fontSize="small" /> };
      case 'contributor':
        return { label: 'Contributor', color: 'success', icon: <CreateIcon fontSize="small" /> };
      case 'reader':
        return { label: 'Reader', color: 'info', icon: <VisibilityIcon fontSize="small" /> };
      default:
        return null;
    }
  };

  const roleInfo = getRoleInfo();

  return (
    <AppBar position="static" color="primary" elevation={1}>
      <Toolbar>
        <Box sx={{ flexGrow: 1 }}>
          <Typography variant="h5" component="h1" sx={{ fontWeight: 600 }}>
            Expense Manager
          </Typography>
          <Typography variant="body2" sx={{ opacity: 0.9, display: { xs: 'none', sm: 'block' } }}>
            Track and split expenses fairly
          </Typography>
        </Box>
        
        <Box sx={{ display: 'flex', gap: { xs: 1, sm: 2 }, alignItems: 'center' }}>
          {roleInfo && (
            <Chip
              icon={roleInfo.icon}
              label={roleInfo.label}
              color={roleInfo.color}
              size="small"
              sx={{ 
                display: { xs: 'none', sm: 'flex' },
                color: 'white',
                fontWeight: 600
              }}
            />
          )}
          
          <IconButton
            color="inherit"
            onClick={onOpenActivityLog}
            title="View Activity Log"
          >
            <HistoryIcon />
          </IconButton>
          
          <IconButton
            onClick={(e) => setUserMenuAnchor(e.currentTarget)}
            sx={{ p: 0 }}
          >
            <Avatar src={user.picture} alt={user.name}>
              {user.name?.charAt(0)}
            </Avatar>
          </IconButton>
          
          <Menu
            anchorEl={userMenuAnchor}
            open={Boolean(userMenuAnchor)}
            onClose={() => setUserMenuAnchor(null)}
          >
            <MenuItem disabled>
              <Typography variant="body2">{user.name}</Typography>
            </MenuItem>
            <MenuItem disabled>
              <Typography variant="caption" color="text.secondary">{user.email}</Typography>
            </MenuItem>
            {roleInfo && (
              <MenuItem disabled>
                <Chip
                  icon={roleInfo.icon}
                  label={roleInfo.label}
                  color={roleInfo.color}
                  size="small"
                  sx={{ fontSize: '0.75rem' }}
                />
              </MenuItem>
            )}
            <Divider />
            <MenuItem onClick={() => { setUserMenuAnchor(null); onLogout(); }}>
              <ListItemIcon>
                <LogoutIcon fontSize="small" />
              </ListItemIcon>
              Logout
            </MenuItem>
          </Menu>
        </Box>
      </Toolbar>
    </AppBar>
  );
}

export default Header;
