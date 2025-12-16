import {
  Box,
  Paper,
  Typography,
  IconButton,
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';

function ExpenseList({ expenses = [], groups = [], onEdit, onDelete }) {
  return (
    <>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2, flexWrap: 'wrap', gap: 1 }}>
        <Typography variant="h6" sx={{ fontWeight: 600, fontSize: { xs: '1.1rem', sm: '1.25rem' } }}>
          Expense History
        </Typography>
      </Box>
      
      {expenses.length === 0 ? (
        <Typography color="text.secondary" align="center" sx={{ py: 4 }}>
          No expenses yet. Add your first expense above.
        </Typography>
      ) : (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
          {expenses.map(expense => {
            const payer = groups.find(g => g.id === expense.paidBy);
            return (
              <Paper key={expense.id} variant="outlined" sx={{ p: { xs: 1.5, sm: 2 } }}>
                <Box sx={{ 
                  display: 'flex', 
                  justifyContent: 'space-between', 
                  alignItems: { xs: 'flex-start', sm: 'center' },
                  flexDirection: { xs: 'column', sm: 'row' },
                  gap: { xs: 1, sm: 2 }
                }}>
                  <Box sx={{ flex: 1, minWidth: 0 }}>
                    <Typography 
                      variant="body1" 
                      sx={{ 
                        fontWeight: 500,
                        fontSize: { xs: '0.95rem', sm: '1rem' },
                        wordBreak: 'break-word'
                      }}
                    >
                      {expense.description}
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ fontSize: { xs: '0.8rem', sm: '0.875rem' } }}>
                      Paid by: {payer?.name || 'Unknown'}
                    </Typography>
                    {expense.createdByName && (
                      <Typography variant="caption" color="text.secondary" sx={{ fontSize: { xs: '0.7rem', sm: '0.75rem' } }}>
                        Added by: {expense.createdByName}
                        {expense.updatedByName && expense.createdByName !== expense.updatedByName && (
                          <> • Edited by: {expense.updatedByName}</>
                        )}
                      </Typography>
                    )}
                  </Box>
                  <Box sx={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: { xs: 1, sm: 2 },
                    alignSelf: { xs: 'flex-end', sm: 'center' }
                  }}>
                    <Typography 
                      variant="h6" 
                      sx={{ 
                        fontWeight: 600,
                        fontSize: { xs: '1.1rem', sm: '1.25rem' }
                      }}
                    >
                      ₹{expense.amount.toFixed(2)}
                    </Typography>
                    <IconButton
                      color="primary"
                      onClick={() => onEdit(expense)}
                      size="small"
                      title="Edit expense"
                    >
                      <EditIcon fontSize="small" />
                    </IconButton>
                    <IconButton
                      color="error"
                      onClick={() => onDelete(expense.id)}
                      size="small"
                      title="Delete expense"
                    >
                      <DeleteIcon fontSize="small" />
                    </IconButton>
                  </Box>
                </Box>
              </Paper>
            );
          })}
        </Box>
      )}
    </>
  );
}

export default ExpenseList;
