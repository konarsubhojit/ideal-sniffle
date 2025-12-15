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
} from '@mui/material';
import HistoryIcon from '@mui/icons-material/History';
import LogoutIcon from '@mui/icons-material/Logout';

function Header({ user, onOpenActivityLog, onLogout }) {
  const [userMenuAnchor, setUserMenuAnchor] = useState(null);

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
