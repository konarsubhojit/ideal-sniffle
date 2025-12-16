import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { Box, Container, Tabs, Tab, Paper } from '@mui/material';
import DashboardIcon from '@mui/icons-material/Dashboard';
import ReceiptIcon from '@mui/icons-material/Receipt';
import AccountBalanceIcon from '@mui/icons-material/AccountBalance';
import HistoryIcon from '@mui/icons-material/History';
import AdminPanelSettingsIcon from '@mui/icons-material/AdminPanelSettings';
import Header from '../components/Header';
import ErrorBoundary from '../components/ErrorBoundary';

function Layout({ user, onOpenActivityLog, onLogout }) {
  const navigate = useNavigate();
  const location = useLocation();

  const getTabValue = () => {
    if (location.pathname === '/') return 0;
    if (location.pathname === '/expenses') return 1;
    if (location.pathname === '/settlements') return 2;
    if (location.pathname === '/activity') return 3;
    if (location.pathname === '/admin') return 4;
    return 0;
  };

  const handleTabChange = (event, newValue) => {
    const routes = ['/', '/expenses', '/settlements', '/activity', '/admin'];
    navigate(routes[newValue]);
  };

  return (
    <Box sx={{ flexGrow: 1, bgcolor: '#f5f5f5', minHeight: '100vh' }}>
      <Header user={user} onOpenActivityLog={onOpenActivityLog} onLogout={onLogout} />
      
      <Container maxWidth="lg" sx={{ mt: 3, mb: 4 }}>
        {/* Navigation Tabs */}
        <Paper sx={{ mb: 3 }}>
          <Tabs
            value={getTabValue()}
            onChange={handleTabChange}
            variant="scrollable"
            scrollButtons="auto"
            sx={{
              borderBottom: 1,
              borderColor: 'divider',
              '& .MuiTab-root': {
                minHeight: { xs: '60px', sm: '72px' },
                fontSize: { xs: '0.8rem', sm: '0.875rem' },
              },
            }}
          >
            <Tab 
              icon={<DashboardIcon />} 
              label="Dashboard" 
              iconPosition="start"
              sx={{ gap: 1 }}
            />
            <Tab 
              icon={<ReceiptIcon />} 
              label="Expenses" 
              iconPosition="start"
              sx={{ gap: 1 }}
            />
            <Tab 
              icon={<AccountBalanceIcon />} 
              label="Settlements" 
              iconPosition="start"
              sx={{ gap: 1 }}
            />
            <Tab 
              icon={<HistoryIcon />} 
              label="Activity" 
              iconPosition="start"
              sx={{ gap: 1 }}
            />
            {user.role === 'admin' && (
              <Tab 
                icon={<AdminPanelSettingsIcon />} 
                label="Admin" 
                iconPosition="start"
                sx={{ gap: 1 }}
              />
            )}
          </Tabs>
        </Paper>

        {/* Page Content */}
        <ErrorBoundary>
          <Outlet />
        </ErrorBoundary>
      </Container>
    </Box>
  );
}

export default Layout;
