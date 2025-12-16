import { Card, CardContent, Typography, CircularProgress, Box, Alert, Grid, Paper } from '@mui/material';
import { useSettlement, useOptimizedSettlements } from '../hooks/useSettlements';
import { getCategoryStats } from '../utils/export';
import SummaryCards from '../components/SummaryCards';
import SummaryTable from '../components/SummaryTable';
import HeadcountSummary from '../components/HeadcountSummary';
import { useExpenses } from '../hooks/useExpenses';
import { useGroups } from '../hooks/useExpenses';

const TOTAL_BILLABLE_HEADS = 27;

function DashboardPage() {
  const { data: expenses = [], isLoading: expensesLoading, error: expensesError } = useExpenses();
  const { data: settlement = [], isLoading: settlementLoading, error: settlementError } = useSettlement();
  const { isLoading: optimizedLoading } = useOptimizedSettlements();
  const { data: groups = [] } = useGroups();

  const loading = expensesLoading || settlementLoading || optimizedLoading;
  const error = expensesError || settlementError;

  // Ensure expenses is always an array before calling reduce
  const safeExpenses = Array.isArray(expenses) ? expenses : [];
  const totalExpense = safeExpenses.reduce((sum, exp) => sum + exp.amount, 0);
  const baseUnitCost = totalExpense / TOTAL_BILLABLE_HEADS;

  // Calculate category statistics
  const { stats: categoryStats } = getCategoryStats(safeExpenses);

  // Calculate top spenders
  const spenderStats = groups.map(group => {
    const totalPaid = safeExpenses
      .filter(exp => exp.paidBy === group.id)
      .reduce((sum, exp) => sum + exp.amount, 0);
    return { name: group.name, total: totalPaid };
  }).sort((a, b) => b.total - a.total).slice(0, 5);

  // Calculate recent trends (last 30 days)
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  const recentExpenses = safeExpenses.filter(exp => new Date(exp.createdAt) >= thirtyDaysAgo);
  const recentTotal = recentExpenses.reduce((sum, exp) => sum + exp.amount, 0);

  if (error) {
    return (
      <Alert severity="error" sx={{ mb: 3 }}>
        Failed to load data. Make sure the backend server is running.
      </Alert>
    );
  }

  return (
    <>
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom sx={{ fontWeight: 600, mb: 3 }}>
            Dashboard Overview
          </Typography>
          
          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
              <CircularProgress />
            </Box>
          ) : (
            <>
              <SummaryCards totalExpense={totalExpense} baseUnitCost={baseUnitCost} />
              
              {/* Analytics Grid */}
              <Grid container spacing={2} sx={{ mt: 2 }}>
                {/* Category Breakdown */}
                <Grid item xs={12} md={6}>
                  <Paper sx={{ p: 2 }}>
                    <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 2 }}>
                      Expenses by Category
                    </Typography>
                    {Object.keys(categoryStats).length === 0 ? (
                      <Typography variant="body2" color="text.secondary">
                        No expenses yet
                      </Typography>
                    ) : (
                      <Box>
                        {Object.entries(categoryStats)
                          .sort((a, b) => b[1].total - a[1].total)
                          .map(([category, data]) => (
                            <Box key={category} sx={{ mb: 2 }}>
                              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                                <Typography variant="body2">{category}</Typography>
                                <Typography variant="body2" sx={{ fontWeight: 600 }}>
                                  ₹{data.total.toFixed(2)} ({data.percentage.toFixed(1)}%)
                                </Typography>
                              </Box>
                              <Box sx={{ width: '100%', height: 8, bgcolor: '#e0e0e0', borderRadius: 1 }}>
                                <Box 
                                  sx={{ 
                                    width: `${data.percentage}%`, 
                                    height: '100%', 
                                    bgcolor: 'primary.main',
                                    borderRadius: 1
                                  }} 
                                />
                              </Box>
                            </Box>
                          ))}
                      </Box>
                    )}
                  </Paper>
                </Grid>

                {/* Top Spenders */}
                <Grid item xs={12} md={6}>
                  <Paper sx={{ p: 2 }}>
                    <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 2 }}>
                      Top Spenders
                    </Typography>
                    {spenderStats.filter(s => s.total > 0).length === 0 ? (
                      <Typography variant="body2" color="text.secondary">
                        No expenses yet
                      </Typography>
                    ) : (
                      <Box>
                        {spenderStats.filter(s => s.total > 0).map((spender, index) => (
                          <Box key={spender.name} sx={{ mb: 2 }}>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                              <Typography variant="body2">
                                {index + 1}. {spender.name}
                              </Typography>
                              <Typography variant="body2" sx={{ fontWeight: 600 }}>
                                ₹{spender.total.toFixed(2)}
                              </Typography>
                            </Box>
                            <Box sx={{ width: '100%', height: 8, bgcolor: '#e0e0e0', borderRadius: 1 }}>
                              <Box 
                                sx={{ 
                                  width: `${totalExpense > 0 ? (spender.total / totalExpense) * 100 : 0}%`, 
                                  height: '100%', 
                                  bgcolor: 'success.main',
                                  borderRadius: 1
                                }} 
                              />
                            </Box>
                          </Box>
                        ))}
                      </Box>
                    )}
                  </Paper>
                </Grid>

                {/* Quick Stats */}
                <Grid item xs={12}>
                  <Paper sx={{ p: 2 }}>
                    <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 2 }}>
                      Quick Stats
                    </Typography>
                    <Grid container spacing={2}>
                      <Grid item xs={6} sm={3}>
                        <Box sx={{ textAlign: 'center' }}>
                          <Typography variant="h5" sx={{ fontWeight: 600, color: 'primary.main' }}>
                            {safeExpenses.length}
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            Total Expenses
                          </Typography>
                        </Box>
                      </Grid>
                      <Grid item xs={6} sm={3}>
                        <Box sx={{ textAlign: 'center' }}>
                          <Typography variant="h5" sx={{ fontWeight: 600, color: 'success.main' }}>
                            ₹{(safeExpenses.length > 0 ? totalExpense / safeExpenses.length : 0).toFixed(2)}
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            Avg per Expense
                          </Typography>
                        </Box>
                      </Grid>
                      <Grid item xs={6} sm={3}>
                        <Box sx={{ textAlign: 'center' }}>
                          <Typography variant="h5" sx={{ fontWeight: 600, color: 'info.main' }}>
                            {recentExpenses.length}
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            Last 30 Days
                          </Typography>
                        </Box>
                      </Grid>
                      <Grid item xs={6} sm={3}>
                        <Box sx={{ textAlign: 'center' }}>
                          <Typography variant="h5" sx={{ fontWeight: 600, color: 'warning.main' }}>
                            ₹{recentTotal.toFixed(2)}
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            Recent Total
                          </Typography>
                        </Box>
                      </Grid>
                    </Grid>
                  </Paper>
                </Grid>
              </Grid>
            </>
          )}
        </CardContent>
      </Card>

      <Card sx={{ mb: 3 }}>
        <CardContent>
          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
              <CircularProgress />
            </Box>
          ) : (
            <HeadcountSummary groups={groups} settlement={settlement} />
          )}
        </CardContent>
      </Card>

      <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom sx={{ fontWeight: 600, mb: 3 }}>
            Settlement Summary
          </Typography>
          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
              <CircularProgress />
            </Box>
          ) : (
            <SummaryTable settlement={settlement} />
          )}
        </CardContent>
      </Card>
    </>
  );
}

export default DashboardPage;
