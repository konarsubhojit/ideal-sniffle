import { useState } from 'react';
import { Card, CardContent, Typography, Button } from '@mui/material';
import { useActivities } from '../hooks/useActivities';
import ActivityLogDialog from '../components/ActivityLogDialog';

function ActivityPage() {
  const [dialogOpen, setDialogOpen] = useState(false);
  const { data: activities = [], refetch, isLoading } = useActivities(50);

  const handleOpenDialog = async () => {
    await refetch();
    setDialogOpen(true);
  };

  return (
    <Card>
      <CardContent>
        <Typography variant="h6" gutterBottom sx={{ fontWeight: 600, mb: 3 }}>
          Activity Log
        </Typography>
        
        <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
          View all recent activity and changes made to expenses.
        </Typography>

        <Button 
          variant="contained" 
          onClick={handleOpenDialog}
          disabled={isLoading}
        >
          {isLoading ? 'Loading...' : 'View Activity Log'}
        </Button>

        <ActivityLogDialog
          open={dialogOpen}
          activities={activities}
          onClose={() => setDialogOpen(false)}
        />
      </CardContent>
    </Card>
  );
}

export default ActivityPage;
