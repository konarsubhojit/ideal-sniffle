import { useEffect } from 'react';
import { Card, CardContent, Typography, Box, CircularProgress, Alert } from '@mui/material';
import { useActivities } from '../hooks/useActivities';
import ActivityList from '../components/ActivityList';

function ActivityPage() {
  const { data: activities = [], isLoading, error, refetch } = useActivities(50);

  useEffect(() => {
    refetch();
  }, [refetch]);

  if (error) {
    return (
      <Alert severity="error" sx={{ mb: 3 }}>
        Failed to load activities. Please try again.
      </Alert>
    );
  }

  return (
    <Card>
      <CardContent>
        <Typography variant="h6" gutterBottom sx={{ fontWeight: 600, mb: 3 }}>
          Activity Log
        </Typography>
        
        <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
          View all recent activity and changes made to expenses.
        </Typography>

        {isLoading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
            <CircularProgress />
          </Box>
        ) : (
          <ActivityList activities={activities} />
        )}
      </CardContent>
    </Card>
  );
}

export default ActivityPage;
