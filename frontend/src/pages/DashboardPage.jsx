import { Card, CardContent, Typography, CircularProgress, Box, Alert } from '@mui/material';
import { useSettlement, useOptimizedSettlements } from '../hooks/useSettlements';
import SummaryCards from '../components/SummaryCards';
import SummaryTable from '../components/SummaryTable';
import { useExpenses } from '../hooks/useExpenses';

const TOTAL_BILLABLE_HEADS = 27;

function DashboardPage() {
  const { data: expenses = [], isLoading: expensesLoading, error: expensesError } = useExpenses();
  const { data: settlement = [], isLoading: settlementLoading, error: settlementError } = useSettlement();
  const { isLoading: optimizedLoading } = useOptimizedSettlements();

  const loading = expensesLoading || settlementLoading || optimizedLoading;
  const error = expensesError || settlementError;

  // Ensure expenses is always an array before calling reduce
  const safeExpenses = Array.isArray(expenses) ? expenses : [];
  const totalExpense = safeExpenses.reduce((sum, exp) => sum + exp.amount, 0);
  const baseUnitCost = totalExpense / TOTAL_BILLABLE_HEADS;

  if (error) {
    return (
      <Alert severity="error" sx={{ mb: 3 }}>
        Failed to load data. Make sure the backend server is running.
      </Alert>
    );
  }

  return (
    <Card>
      <CardContent>
        <Typography variant="h6" gutterBottom sx={{ fontWeight: 600, mb: 3 }}>
          Dashboard - Who Owes Who
        </Typography>
        
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
            <CircularProgress />
          </Box>
        ) : (
          <>
            <SummaryCards totalExpense={totalExpense} baseUnitCost={baseUnitCost} />
            <SummaryTable settlement={settlement} />
          </>
        )}
      </CardContent>
    </Card>
  );
}

export default DashboardPage;
