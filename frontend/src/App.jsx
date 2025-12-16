import { useState, lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { CircularProgress, Box } from '@mui/material';
import { useAuth } from './hooks/useAuth';
import LoginPage from './components/LoginPage';
import Layout from './components/Layout';
import { useActivities } from './hooks/useActivities';
import ActivityLogDialog from './components/ActivityLogDialog';

// Lazy load page components for code splitting
const DashboardPage = lazy(() => import('./pages/DashboardPage'));
const ExpensesPage = lazy(() => import('./pages/ExpensesPage'));
const SettlementsPage = lazy(() => import('./pages/SettlementsPage'));
const ActivityPage = lazy(() => import('./pages/ActivityPage'));

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
      <AppContent />
    </QueryClientProvider>
  );
}

export default App;
