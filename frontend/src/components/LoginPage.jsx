import {
  Box,
  AppBar,
  Toolbar,
  Typography,
  Container,
  Paper,
  Button,
} from '@mui/material';
import LoginIcon from '@mui/icons-material/Login';

function LoginPage({ onLogin }) {
  return (
    <Box sx={{ flexGrow: 1, bgcolor: '#f5f5f5', minHeight: '100vh' }}>
      <AppBar position="static" color="primary" elevation={1}>
        <Toolbar>
          <Typography variant="h5" component="h1" sx={{ fontWeight: 600, flexGrow: 1 }}>
            Expense Manager
          </Typography>
        </Toolbar>
      </AppBar>
      
      <Container maxWidth="sm" sx={{ mt: { xs: 4, sm: 8 }, px: { xs: 2, sm: 3 } }}>
        <Paper sx={{ p: { xs: 3, sm: 4 }, textAlign: 'center' }}>
          <Typography variant="h5" gutterBottom>
            Welcome to Expense Manager
          </Typography>
          <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
            Please sign in with your Google account to continue
          </Typography>
          <Button
            variant="contained"
            size="large"
            startIcon={<LoginIcon />}
            onClick={onLogin}
            fullWidth
            sx={{ maxWidth: '300px' }}
          >
            Sign in with Google
          </Button>
        </Paper>
      </Container>
    </Box>
  );
}

export default LoginPage;
