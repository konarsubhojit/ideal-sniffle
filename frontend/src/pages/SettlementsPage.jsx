import { useState } from 'react';
import { Card, CardContent, Typography, CircularProgress, Box, Alert, Tabs, Tab } from '@mui/material';
import { useSettlement, useOptimizedSettlements } from '../hooks/useSettlements';
import { useGroups } from '../hooks/useExpenses';
import SettlementsView from '../components/SettlementsView';
import PersonView from '../components/PersonView';

function SettlementsPage() {
  const [selectedTab, setSelectedTab] = useState(0);
  const [selectedPerson, setSelectedPerson] = useState(null);

  const { data: settlement = [], isLoading: settlementLoading, error: settlementError } = useSettlement();
  const { data: optimizedSettlements = [], isLoading: optimizedLoading, error: optimizedError } = useOptimizedSettlements();
  const { data: groups = [], isLoading: groupsLoading } = useGroups();

  const loading = settlementLoading || optimizedLoading || groupsLoading;
  const error = settlementError || optimizedError;

  if (error) {
    return (
      <Alert severity="error" sx={{ mb: 3 }}>
        Failed to load settlements. Make sure the backend server is running.
      </Alert>
    );
  }

  return (
    <Card>
      <CardContent>
        <Typography variant="h6" gutterBottom sx={{ fontWeight: 600, mb: 3 }}>
          Settlement Plans
        </Typography>
        
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
            <CircularProgress />
          </Box>
        ) : (
          <>
            <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
              <Tabs 
                value={selectedTab} 
                onChange={(e, newValue) => setSelectedTab(newValue)}
                variant="scrollable"
                scrollButtons="auto"
              >
                <Tab label="Optimized Settlements" />
                <Tab label="By Person" />
              </Tabs>
            </Box>

            {selectedTab === 0 && (
              <SettlementsView optimizedSettlements={optimizedSettlements} />
            )}

            {selectedTab === 1 && (
              <PersonView
                groups={groups}
                selectedPerson={selectedPerson}
                onSelectPerson={setSelectedPerson}
                settlement={settlement}
                optimizedSettlements={optimizedSettlements}
              />
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}

export default SettlementsPage;
