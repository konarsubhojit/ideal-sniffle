import { 
  Box, 
  Paper, 
  Typography, 
  Table, 
  TableBody, 
  TableCell, 
  TableContainer, 
  TableHead, 
  TableRow,
  Chip,
  Divider,
  Grid
} from '@mui/material';
import GroupIcon from '@mui/icons-material/Group';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';

function HeadcountSummary({ groups = [], settlement = [] }) {
  // Calculate summary statistics
  const calculateStats = () => {
    let totalMembers = 0;
    let totalBillable = 0;
    let internalMembers = 0;
    let internalBillable = 0;
    let externalMembers = 0;
    let externalBillable = 0;

    groups.forEach(group => {
      const members = group.members || [];
      const memberCount = members.length > 0 ? members.length : group.count;
      
      if (group.type === 'Internal') {
        internalMembers += memberCount;
        
        if (members.length > 0) {
          // Count members not excluded from internal calculation
          const billable = members.filter(
            m => !m.excludeFromAllHeadcount && !m.excludeFromInternalHeadcount
          ).length;
          internalBillable += billable;
        } else {
          internalBillable += group.count;
        }
      } else {
        externalMembers += memberCount;
        
        if (members.length > 0) {
          // Count members not excluded from all headcount
          const billable = members.filter(m => !m.excludeFromAllHeadcount).length;
          externalBillable += billable;
        } else {
          externalBillable += group.count;
        }
      }
      
      totalMembers += memberCount;
    });

    totalBillable = internalBillable + externalBillable;

    return {
      totalMembers,
      totalBillable,
      internalMembers,
      internalBillable,
      externalMembers,
      externalBillable
    };
  };

  const stats = calculateStats();
  const totalExpense = settlement.reduce((sum, s) => sum + s.totalPaid, 0);
  const costPerHead = stats.totalBillable > 0 ? totalExpense / stats.totalBillable : 0;
  const externalCost = costPerHead * stats.externalBillable;
  const internalTotalCost = totalExpense - externalCost;
  const internalCostPerMember = stats.internalBillable > 0 ? internalTotalCost / stats.internalBillable : 0;

  return (
    <Paper sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 3 }}>
        <GroupIcon color="primary" />
        <Typography variant="h6" sx={{ fontWeight: 600 }}>
          Headcount Summary & Calculation Breakdown
        </Typography>
      </Box>

      {/* Summary Cards */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Paper sx={{ p: 2, bgcolor: '#e3f2fd', textAlign: 'center' }}>
            <Typography variant="body2" color="text.secondary">
              Total Members
            </Typography>
            <Typography variant="h4" sx={{ fontWeight: 600 }}>
              {stats.totalMembers}
            </Typography>
          </Paper>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Paper sx={{ p: 2, bgcolor: '#e8f5e9', textAlign: 'center' }}>
            <Typography variant="body2" color="text.secondary">
              Billable Heads
            </Typography>
            <Typography variant="h4" sx={{ fontWeight: 600, color: 'success.main' }}>
              {stats.totalBillable}
            </Typography>
          </Paper>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Paper sx={{ p: 2, bgcolor: '#f3e5f5', textAlign: 'center' }}>
            <Typography variant="body2" color="text.secondary">
              Internal Billable
            </Typography>
            <Typography variant="h4" sx={{ fontWeight: 600, color: 'primary.main' }}>
              {stats.internalBillable}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              of {stats.internalMembers} total
            </Typography>
          </Paper>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Paper sx={{ p: 2, bgcolor: '#fff3e0', textAlign: 'center' }}>
            <Typography variant="body2" color="text.secondary">
              External Billable
            </Typography>
            <Typography variant="h4" sx={{ fontWeight: 600, color: 'warning.main' }}>
              {stats.externalBillable}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              of {stats.externalMembers} total
            </Typography>
          </Paper>
        </Grid>
      </Grid>

      <Divider sx={{ my: 3 }} />

      {/* Calculation Breakdown */}
      <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 2 }}>
        Step-by-Step Calculation
      </Typography>
      
      <Box sx={{ mb: 3 }}>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
          1. Total Expense: <strong>₹{totalExpense.toFixed(2)}</strong>
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
          2. Base Cost Per Head: ₹{totalExpense.toFixed(2)} ÷ {stats.totalBillable} = <strong>₹{costPerHead.toFixed(2)}</strong>
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
          3. External Groups Total: ₹{costPerHead.toFixed(2)} × {stats.externalBillable} = <strong>₹{externalCost.toFixed(2)}</strong>
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
          4. Internal Groups Total: ₹{totalExpense.toFixed(2)} - ₹{externalCost.toFixed(2)} = <strong>₹{internalTotalCost.toFixed(2)}</strong>
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
          5. Internal Cost Per Member: ₹{internalTotalCost.toFixed(2)} ÷ {stats.internalBillable} = <strong>₹{internalCostPerMember.toFixed(2)}</strong>
        </Typography>
      </Box>

      {/* Group Details */}
      <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 2 }}>
        Group Breakdown
      </Typography>
      
      <TableContainer>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell sx={{ fontWeight: 600 }}>Group</TableCell>
              <TableCell align="center" sx={{ fontWeight: 600 }}>Type</TableCell>
              <TableCell align="center" sx={{ fontWeight: 600 }}>Total</TableCell>
              <TableCell align="center" sx={{ fontWeight: 600 }}>Billable</TableCell>
              <TableCell align="center" sx={{ fontWeight: 600 }}>Excluded</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {groups.map(group => {
              const members = group.members || [];
              const totalCount = members.length > 0 ? members.length : group.count;
              let billableCount, excludedCount;
              
              if (members.length > 0) {
                if (group.type === 'Internal') {
                  billableCount = members.filter(
                    m => !m.excludeFromAllHeadcount && !m.excludeFromInternalHeadcount
                  ).length;
                } else {
                  billableCount = members.filter(m => !m.excludeFromAllHeadcount).length;
                }
                excludedCount = totalCount - billableCount;
              } else {
                billableCount = group.count;
                excludedCount = 0;
              }

              return (
                <TableRow key={group.id}>
                  <TableCell>{group.name}</TableCell>
                  <TableCell align="center">
                    <Chip
                      label={group.type}
                      size="small"
                      color={group.type === 'External' ? 'warning' : 'primary'}
                    />
                  </TableCell>
                  <TableCell align="center">{totalCount}</TableCell>
                  <TableCell align="center">
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 0.5 }}>
                      <CheckCircleIcon fontSize="small" color="success" />
                      {billableCount}
                    </Box>
                  </TableCell>
                  <TableCell align="center">
                    {excludedCount > 0 ? (
                      <Chip label={excludedCount} size="small" color="error" />
                    ) : (
                      '-'
                    )}
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </TableContainer>
    </Paper>
  );
}

export default HeadcountSummary;
