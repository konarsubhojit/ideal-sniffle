import {
  TableContainer,
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
  Paper,
  Box,
  Typography,
  Chip,
} from '@mui/material';

function SummaryTable({ settlement }) {
  return (
    <TableContainer 
      component={Paper} 
      variant="outlined"
      sx={{ 
        overflowX: 'auto',
        // Ensure table scrolls horizontally on mobile
        maxWidth: '100%'
      }}
    >
      <Table sx={{ minWidth: { xs: 500, sm: 650 } }}>
        <TableHead>
          <TableRow>
            <TableCell sx={{ fontWeight: 600 }}>Person</TableCell>
            <TableCell align="center" sx={{ fontWeight: 600 }}>People</TableCell>
            <TableCell align="right" sx={{ fontWeight: 600 }}>Paid</TableCell>
            <TableCell align="right" sx={{ fontWeight: 600 }}>Share</TableCell>
            <TableCell align="right" sx={{ fontWeight: 600 }}>Balance</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {settlement.map(group => (
            <TableRow key={group.id} hover>
              <TableCell>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
                  {group.name}
                  {group.type === "External" && (
                    <Chip label="Ext" size="small" color="warning" />
                  )}
                </Box>
              </TableCell>
              <TableCell align="center">{group.count}</TableCell>
              <TableCell align="right">₹{group.totalPaid.toFixed(2)}</TableCell>
              <TableCell align="right">₹{group.fairShare.toFixed(2)}</TableCell>
              <TableCell align="right">
                {group.balance > 0 ? (
                  <Typography color="success.main" sx={{ fontWeight: 600 }}>
                    +₹{group.balance.toFixed(2)}
                  </Typography>
                ) : group.balance < 0 ? (
                  <Typography color="error.main" sx={{ fontWeight: 600 }}>
                    -₹{Math.abs(group.balance).toFixed(2)}
                  </Typography>
                ) : (
                  <Typography color="text.secondary">₹0.00</Typography>
                )}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
}

export default SummaryTable;
