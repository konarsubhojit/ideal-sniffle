import { Grid, Paper, Typography } from '@mui/material';

function SummaryCards({ totalExpense, baseUnitCost }) {
  return (
    <Grid container spacing={2} sx={{ mb: 3 }}>
      <Grid item xs={12} sm={6}>
        <Paper sx={{ p: 2, bgcolor: '#e3f2fd' }}>
          <Typography variant="body2" color="text.secondary">
            Total Expense
          </Typography>
          <Typography variant="h4" sx={{ fontWeight: 600, fontSize: { xs: '1.75rem', sm: '2.125rem' } }}>
            ₹{totalExpense.toFixed(2)}
          </Typography>
        </Paper>
      </Grid>
      <Grid item xs={12} sm={6}>
        <Paper sx={{ p: 2, bgcolor: '#f3e5f5' }}>
          <Typography variant="body2" color="text.secondary">
            Cost Per Head
          </Typography>
          <Typography variant="h4" sx={{ fontWeight: 600, fontSize: { xs: '1.75rem', sm: '2.125rem' } }}>
            ₹{baseUnitCost.toFixed(2)}
          </Typography>
        </Paper>
      </Grid>
    </Grid>
  );
}

export default SummaryCards;
