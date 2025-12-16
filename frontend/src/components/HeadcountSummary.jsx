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
  Grid,
  Tooltip
} from '@mui/material';
import GroupIcon from '@mui/icons-material/Group';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';

// Helper function to calculate billable count from total count minus exclusions
const calculateBillableCount = (totalCount, excludedMembers, excludeType) => {
  if (!excludedMembers || excludedMembers.length === 0) {
    return totalCount;
  }
  
  const exclusionCount = excludedMembers.filter(m => {
    if (excludeType === 'global') {
      return m.excludeFromAllHeadcount;
    } else if (excludeType === 'both') {
      return m.excludeFromAllHeadcount || m.excludeFromInternalHeadcount;
    }
    return false;
  }).length;
  
  return totalCount - exclusionCount;
};

function HeadcountSummary({ groups = [], settlement = [] }) {
  // Calculate summary statistics
  const calculateStats = () => {
    let totalMembers = 0;
    let totalBillable = 0; // Excludes only globally excluded members
    let internalMembers = 0;
    let internalBillable = 0; // For internal payment calculation (excludes both global and internal)
    let externalMembers = 0;
    let externalBillable = 0;

    groups.forEach(group => {
      const totalCount = group.count; // Total members from group.count
      const excludedMembers = group.members || []; // Only stores excluded members
      
      if (group.type === 'Internal') {
        internalMembers += totalCount;
        
        // For internal payment: exclude both globally and internally excluded
        internalBillable += calculateBillableCount(totalCount, excludedMembers, 'both');
        
        // For total billable (base cost): exclude only globally excluded
        totalBillable += calculateBillableCount(totalCount, excludedMembers, 'global');
      } else {
        externalMembers += totalCount;
        
        // Count members not excluded from all headcount
        const billable = calculateBillableCount(totalCount, excludedMembers, 'global');
        externalBillable += billable;
        totalBillable += billable;
      }
      
      totalMembers += totalCount;
    });

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
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 0.5, mb: 0.5 }}>
              <Typography variant="body2" color="text.secondary">
                Billable Heads
              </Typography>
              <Tooltip title="Used for base cost calculation. Excludes only globally excluded members." arrow>
                <InfoOutlinedIcon sx={{ fontSize: 16, color: 'text.secondary' }} />
              </Tooltip>
            </Box>
            <Typography variant="h4" sx={{ fontWeight: 600, color: 'success.main' }}>
              {stats.totalBillable}
            </Typography>
          </Paper>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Paper sx={{ p: 2, bgcolor: '#f3e5f5', textAlign: 'center' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 0.5, mb: 0.5 }}>
              <Typography variant="body2" color="text.secondary">
                Internal Billable
              </Typography>
              <Tooltip title="Members who actually pay in internal groups. Excludes both globally and internally excluded members." arrow>
                <InfoOutlinedIcon sx={{ fontSize: 16, color: 'text.secondary' }} />
              </Tooltip>
            </Box>
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
              const totalCount = group.count; // Total from group.count
              const excludedMembers = group.members || []; // Only stores excluded members
              
              let billableCount, excludedCount;
              
              if (group.type === 'Internal') {
                // For internal groups, show payment billable count (excludes both)
                billableCount = calculateBillableCount(totalCount, excludedMembers, 'both');
              } else {
                // For external groups, show billable count (excludes only global)
                billableCount = calculateBillableCount(totalCount, excludedMembers, 'global');
              }
              excludedCount = totalCount - billableCount;

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
