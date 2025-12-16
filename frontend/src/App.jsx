import { useState, lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { CircularProgress, Box, Typography, IconButton } from '@mui/material';
import LogoutIcon from '@mui/icons-material/Logout';
import { useAuth } from './hooks/useAuth';
import LoginPage from './components/LoginPage';
import Layout from './components/Layout';
import { useActivities } from './hooks/useActivities';
import ActivityLogDialog from './components/ActivityLogDialog';
import { SnackbarProvider } from './contexts/SnackbarContext';

// Lazy load page components for code splitting
const DashboardPage = lazy(() => import('./pages/DashboardPage'));
const ExpensesPage = lazy(() => import('./pages/ExpensesPage'));
const SettlementsPage = lazy(() => import('./pages/SettlementsPage'));
const ActivityPage = lazy(() => import('./pages/ActivityPage'));
const AdminPage = lazy(() => import('./pages/AdminPage'));

// Reusable loading fallback for lazy-loaded routes
const PageLoadingFallback = (
  <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
    <CircularProgress />
  </Box>
);

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
      staleTime: 30000, // 30 seconds
    },
  },
});

function AppContent() {
  const { user, loading, login, logout, isAuthenticated } = useAuth();
  const [activityDialogOpen, setActivityDialogOpen] = useState(false);
  const { data: activities = [], refetch: refetchActivities } = useActivities(50);

  const handleOpenActivityLog = async () => {
    await refetchActivities();
    setActivityDialogOpen(true);
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  if (!isAuthenticated) {
    return <LoginPage onLogin={login} />;
  }

  // Check if user has no role (403 Forbidden)
  if (!user.role) {
    return (
      <Box sx={{ 
        display: 'flex', 
        flexDirection: 'column',
        justifyContent: 'center', 
        alignItems: 'center', 
        minHeight: '100vh',
        p: 3,
        textAlign: 'center'
      }}>
        <Typography variant="h3" color="error" gutterBottom sx={{ fontWeight: 600 }}>
          403 - Access Forbidden
        </Typography>
        <Typography variant="h6" color="text.secondary" paragraph>
          You do not have permission to access this application.
        </Typography>
        <Typography variant="body1" color="text.secondary" paragraph>
          Please contact an administrator to request access.
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
          Logged in as: {user.name} ({user.email})
        </Typography>
        <Box sx={{ mt: 3 }}>
          <IconButton
            onClick={logout}
            color="primary"
            sx={{ 
              border: '1px solid',
              borderRadius: 2,
              px: 2,
              py: 1
            }}
          >
            <LogoutIcon sx={{ mr: 1 }} />
            <Typography>Logout</Typography>
          </IconButton>
        </Box>
      </Box>
    );
  }

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Layout user={user} onOpenActivityLog={handleOpenActivityLog} onLogout={logout} />}>
          <Route index element={
            <Suspense fallback={PageLoadingFallback}>
              <DashboardPage />
            </Suspense>
          } />
          <Route path="expenses" element={
            <Suspense fallback={PageLoadingFallback}>
              <ExpensesPage />
            </Suspense>
          } />
          <Route path="settlements" element={
            <Suspense fallback={PageLoadingFallback}>
              <SettlementsPage />
            </Suspense>
          } />
          <Route path="activity" element={
            <Suspense fallback={PageLoadingFallback}>
              <ActivityPage />
            </Suspense>
          } />
          <Route path="admin" element={
            <Suspense fallback={PageLoadingFallback}>
              <AdminPage />
            </Suspense>
          } />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
      
      <ActivityLogDialog
        open={activityDialogOpen}
        activities={activities}
        onClose={() => setActivityDialogOpen(false)}
      />
    </BrowserRouter>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <SnackbarProvider>
        <AppContent />
      </SnackbarProvider>
    </QueryClientProvider>
  );
}

export default App;
