import { useState } from 'react';
import { Card, CardContent, Typography, CircularProgress, Box, Alert, Tabs, Tab, IconButton, Tooltip } from '@mui/material';
import PictureAsPdfIcon from '@mui/icons-material/PictureAsPdf';
import { useSettlement, useOptimizedSettlements } from '../hooks/useSettlements';
import { useGroups } from '../hooks/useExpenses';
import { useSnackbar } from '../contexts/SnackbarContext';
import { exportSettlementToPDF } from '../utils/export';
import SettlementsView from '../components/SettlementsView';
import PersonView from '../components/PersonView';

function SettlementsPage() {
  const [selectedTab, setSelectedTab] = useState(0);
  const [selectedPerson, setSelectedPerson] = useState(null);
  const showSnackbar = useSnackbar();

  const { data: settlement = [], isLoading: settlementLoading, error: settlementError } = useSettlement();
  const { data: optimizedSettlements = [], isLoading: optimizedLoading, error: optimizedError } = useOptimizedSettlements();
  const { data: groups = [], isLoading: groupsLoading } = useGroups();

  const loading = settlementLoading || optimizedLoading || groupsLoading;
  const error = settlementError || optimizedError;

  const handleExportPDF = () => {
    exportSettlementToPDF(settlement, optimizedSettlements);
    showSnackbar('Settlement report opened for printing/PDF!', 'success');
  };

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
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Typography variant="h6" sx={{ fontWeight: 600 }}>
            Settlement Plans
          </Typography>
          {settlement.length > 0 && (
            <Tooltip title="Export to PDF">
              <IconButton color="primary" onClick={handleExportPDF} size="small">
                <PictureAsPdfIcon />
              </IconButton>
            </Tooltip>
          )}
        </Box>
        
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
