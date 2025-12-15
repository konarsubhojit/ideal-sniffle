import {
  Box,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Paper,
  Typography,
  List,
  ListItem,
  ListItemText,
} from '@mui/material';

function PersonView({ groups, selectedPerson, onSelectPerson, settlement, optimizedSettlements }) {
  const getPersonTransactions = (personId) => {
    const toPay = optimizedSettlements.filter(t => t.from === personId);
    const toReceive = optimizedSettlements.filter(t => t.to === personId);
    return { toPay, toReceive };
  };

  return (
    <Box>
      <FormControl fullWidth sx={{ mb: 3 }}>
        <InputLabel>Select Person</InputLabel>
        <Select
          value={selectedPerson || ''}
          label="Select Person"
          onChange={(e) => onSelectPerson(e.target.value)}
        >
          {groups.map(group => (
            <MenuItem key={group.id} value={group.id}>
              {group.name}
            </MenuItem>
          ))}
        </Select>
      </FormControl>

      {selectedPerson && (
        <Paper variant="outlined" sx={{ p: { xs: 2, sm: 3 } }}>
          <Typography variant="h6" gutterBottom sx={{ fontWeight: 600, mb: 2, fontSize: { xs: '1.1rem', sm: '1.25rem' } }}>
            {groups.find(g => g.id === selectedPerson)?.name}'s Transactions
          </Typography>

          {(() => {
            const { toPay, toReceive } = getPersonTransactions(selectedPerson);
            const personBalance = settlement.find(s => s.id === selectedPerson)?.balance || 0;

            return (
              <>
                <Box sx={{ 
                  mb: 3, 
                  p: 2, 
                  bgcolor: personBalance > 0 ? '#e8f5e9' : personBalance < 0 ? '#ffebee' : '#f5f5f5', 
                  borderRadius: 1 
                }}>
                  <Typography variant="body2" color="text.secondary">
                    Net Balance
                  </Typography>
                  <Typography 
                    variant="h4" 
                    sx={{ 
                      fontWeight: 600, 
                      fontSize: { xs: '1.75rem', sm: '2.125rem' },
                      color: personBalance > 0 ? 'success.main' : personBalance < 0 ? 'error.main' : 'text.secondary' 
                    }}
                  >
                    {personBalance > 0 ? '+' : ''}₹{personBalance.toFixed(2)}
                  </Typography>
                  <Typography variant="body2" sx={{ mt: 1 }}>
                    {personBalance > 0 ? '(Will receive)' : personBalance < 0 ? '(Needs to pay)' : '(All settled)'}
                  </Typography>
                </Box>

                {toPay.length > 0 && (
                  <Box sx={{ mb: 3 }}>
                    <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 1, color: 'error.main' }}>
                      To Pay:
                    </Typography>
                    <List>
                      {toPay.map((transaction, index) => (
                        <ListItem key={index} sx={{ px: 0, py: 1 }}>
                          <ListItemText
                            primary={
                              <Box sx={{ 
                                display: 'flex', 
                                justifyContent: 'space-between', 
                                alignItems: 'center',
                                flexDirection: { xs: 'column', sm: 'row' },
                                gap: { xs: 1, sm: 0 }
                              }}>
                                <Typography>Pay to <strong>{transaction.toName}</strong></Typography>
                                <Typography 
                                  variant="h6" 
                                  color="error.main" 
                                  sx={{ fontWeight: 600, fontSize: { xs: '1.1rem', sm: '1.25rem' } }}
                                >
                                  ₹{transaction.amount.toFixed(2)}
                                </Typography>
                              </Box>
                            }
                          />
                        </ListItem>
                      ))}
                    </List>
                  </Box>
                )}

                {toReceive.length > 0 && (
                  <Box>
                    <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 1, color: 'success.main' }}>
                      To Receive:
                    </Typography>
                    <List>
                      {toReceive.map((transaction, index) => (
                        <ListItem key={index} sx={{ px: 0, py: 1 }}>
                          <ListItemText
                            primary={
                              <Box sx={{ 
                                display: 'flex', 
                                justifyContent: 'space-between', 
                                alignItems: 'center',
                                flexDirection: { xs: 'column', sm: 'row' },
                                gap: { xs: 1, sm: 0 }
                              }}>
                                <Typography>Receive from <strong>{transaction.fromName}</strong></Typography>
                                <Typography 
                                  variant="h6" 
                                  color="success.main" 
                                  sx={{ fontWeight: 600, fontSize: { xs: '1.1rem', sm: '1.25rem' } }}
                                >
                                  ₹{transaction.amount.toFixed(2)}
                                </Typography>
                              </Box>
                            }
                          />
                        </ListItem>
                      ))}
                    </List>
                  </Box>
                )}

                {toPay.length === 0 && toReceive.length === 0 && (
                  <Typography color="text.secondary" align="center" sx={{ py: 4 }}>
                    All settled! No transactions needed.
                  </Typography>
                )}
              </>
            );
          })()}
        </Paper>
      )}
    </Box>
  );
}

export default PersonView;
