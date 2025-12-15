import { useState, useEffect, Fragment } from 'react';
import {
  AppBar,
  Toolbar,
  Typography,
  Container,
  Box,
  Card,
  CardContent,
  Grid,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  TextField,
  Button,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Alert,
  CircularProgress,
  Chip,
  IconButton,
  Tabs,
  Tab,
  List,
  ListItem,
  ListItemText,
  Divider,
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import AddIcon from '@mui/icons-material/Add';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

function App() {
  // Hardcoded groups as per requirement
  const groups = [
    { id: 1, name: "Other Family", count: 3, type: "External" },
    { id: 2, name: "Subhojit", count: 3, type: "Internal" },
    { id: 3, name: "Ravi Ranjan Verma", count: 3, type: "Internal" },
    { id: 4, name: "Abhijit Koner", count: 2, type: "Internal" },
    { id: 5, name: "Apurba Samanta", count: 2, type: "Internal" },
    { id: 6, name: "Gopal Samanta", count: 2, type: "Internal" },
    { id: 7, name: "Anupam Chakraborty", count: 2, type: "Internal" },
    { id: 8, name: "Arindra Sahana", count: 2, type: "Internal" },
    { id: 9, name: "Nupur Mondol", count: 2, type: "Internal" },
  ];

  // Constants
  const TOTAL_BILLABLE_HEADS = 27;
  const MAIN_FAMILY_PAYING_COUNT = 18;

  // State
  const [expenses, setExpenses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedTab, setSelectedTab] = useState(0);
  const [selectedPerson, setSelectedPerson] = useState(null);
  
  const [formData, setFormData] = useState({
    paidBy: groups[0].id,
    amount: '',
    description: ''
  });

  // Fetch expenses from backend
  useEffect(() => {
    fetchExpenses();
  }, []);

  const fetchExpenses = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_URL}/api/expenses`);
      if (!response.ok) throw new Error('Failed to fetch expenses');
      const data = await response.json();
      // Ensure amount is a number
      const normalizedData = data.map(exp => ({
        ...exp,
        amount: parseFloat(exp.amount)
      }));
      setExpenses(normalizedData);
      setError(null);
    } catch (error) {
      console.error('Error fetching expenses:', error);
      setError('Failed to load expenses. Make sure the backend server is running.');
    } finally {
      setLoading(false);
    }
  };

  // Calculate totals and settlements
  const calculateSettlement = () => {
    const totalExpense = expenses.reduce((sum, exp) => sum + exp.amount, 0);
    const baseUnitCost = totalExpense / TOTAL_BILLABLE_HEADS;
    
    return groups.map(group => {
      const totalPaid = expenses
        .filter(exp => exp.paidBy === group.id)
        .reduce((sum, exp) => sum + exp.amount, 0);
      
      let fairShare;
      if (group.type === "External") {
        // Other Family pays base unit cost * their count
        fairShare = baseUnitCost * group.count;
      } else {
        // Main Family members share the remaining cost equally
        const otherFamilyCost = baseUnitCost * 3;
        const mainFamilyShare = (totalExpense - otherFamilyCost) / MAIN_FAMILY_PAYING_COUNT;
        fairShare = mainFamilyShare;
      }
      
      const balance = totalPaid - fairShare;
      
      return {
        ...group,
        totalPaid,
        fairShare,
        balance
      };
    });
  };

  // Calculate optimized settlements (reduce transactions)
  const calculateOptimizedSettlements = () => {
    const settlement = calculateSettlement();
    
    // Separate creditors (people who should receive money) and debtors (people who should pay)
    const creditors = settlement.filter(s => s.balance > 0.01).map(s => ({
      id: s.id,
      name: s.name,
      amount: s.balance
    }));
    
    const debtors = settlement.filter(s => s.balance < -0.01).map(s => ({
      id: s.id,
      name: s.name,
      amount: Math.abs(s.balance)
    }));
    
    // Calculate optimized transactions
    const transactions = [];
    let i = 0, j = 0;
    
    while (i < creditors.length && j < debtors.length) {
      const credit = creditors[i].amount;
      const debt = debtors[j].amount;
      const settled = Math.min(credit, debt);
      
      if (settled > 0.01) {
        transactions.push({
          from: debtors[j].id,
          fromName: debtors[j].name,
          to: creditors[i].id,
          toName: creditors[i].name,
          amount: settled
        });
      }
      
      creditors[i].amount -= settled;
      debtors[j].amount -= settled;
      
      if (creditors[i].amount < 0.01) i++;
      if (debtors[j].amount < 0.01) j++;
    }
    
    return transactions;
  };

  const handleAddExpense = async (e) => {
    e.preventDefault();
    if (!formData.amount || formData.amount <= 0) return;
    
    try {
      const response = await fetch(`${API_URL}/api/expenses`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          paidBy: formData.paidBy,
          amount: parseFloat(formData.amount),
          description: formData.description || 'No description'
        }),
      });
      
      if (!response.ok) throw new Error('Failed to add expense');
      
      await fetchExpenses();
      setFormData({ ...formData, amount: '', description: '' });
      setError(null);
    } catch (error) {
      console.error('Error adding expense:', error);
      setError('Failed to add expense. Please try again.');
    }
  };

  const handleDeleteExpense = async (id) => {
    try {
      const response = await fetch(`${API_URL}/api/expenses/${id}`, {
        method: 'DELETE',
      });
      
      if (!response.ok) throw new Error('Failed to delete expense');
      
      await fetchExpenses();
      setError(null);
    } catch (error) {
      console.error('Error deleting expense:', error);
      setError('Failed to delete expense. Please try again.');
    }
  };

  const handleReset = async () => {
    if (window.confirm('Are you sure you want to reset all data?')) {
      try {
        const response = await fetch(`${API_URL}/api/expenses`, {
          method: 'DELETE',
        });
        
        if (!response.ok) throw new Error('Failed to reset expenses');
        
        await fetchExpenses();
        setFormData({ paidBy: groups[0].id, amount: '', description: '' });
        setError(null);
      } catch (error) {
        console.error('Error resetting expenses:', error);
        setError('Failed to reset expenses. Please try again.');
      }
    }
  };

  const settlement = calculateSettlement();
  const optimizedSettlements = calculateOptimizedSettlements();
  const totalExpense = expenses.reduce((sum, exp) => sum + exp.amount, 0);
  const baseUnitCost = totalExpense / TOTAL_BILLABLE_HEADS;

  // Get transactions for a specific person
  const getPersonTransactions = (personId) => {
    const toPay = optimizedSettlements.filter(t => t.from === personId);
    const toReceive = optimizedSettlements.filter(t => t.to === personId);
    return { toPay, toReceive };
  };

  return (
    <Box sx={{ flexGrow: 1, bgcolor: '#f5f5f5', minHeight: '100vh' }}>
      {/* Header */}
      <AppBar position="static" color="primary" elevation={1}>
        <Toolbar>
          <Box>
            <Typography variant="h5" component="h1" sx={{ fontWeight: 600 }}>
              Expense Manager
            </Typography>
            <Typography variant="body2" sx={{ opacity: 0.9 }}>
              Track and split expenses fairly
            </Typography>
          </Box>
        </Toolbar>
      </AppBar>

      <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
        {/* Error Message */}
        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}

        {/* Dashboard with Tabs */}
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Typography variant="h6" gutterBottom sx={{ fontWeight: 600 }}>
              Dashboard - Who Owes Who
            </Typography>
            
            {loading ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
                <CircularProgress />
              </Box>
            ) : (
              <>
                {/* Summary Cards */}
                <Grid container spacing={2} sx={{ mb: 3 }}>
                  <Grid item xs={12} md={6}>
                    <Paper sx={{ p: 2, bgcolor: '#e3f2fd' }}>
                      <Typography variant="body2" color="text.secondary">
                        Total Expense
                      </Typography>
                      <Typography variant="h4" sx={{ fontWeight: 600 }}>
                        ₹{totalExpense.toFixed(2)}
                      </Typography>
                    </Paper>
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <Paper sx={{ p: 2, bgcolor: '#f3e5f5' }}>
                      <Typography variant="body2" color="text.secondary">
                        Cost Per Head
                      </Typography>
                      <Typography variant="h4" sx={{ fontWeight: 600 }}>
                        ₹{baseUnitCost.toFixed(2)}
                      </Typography>
                    </Paper>
                  </Grid>
                </Grid>

                {/* Tabs for different views */}
                <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 2 }}>
                  <Tabs value={selectedTab} onChange={(e, newValue) => setSelectedTab(newValue)}>
                    <Tab label="Summary" />
                    <Tab label="Settlements" />
                    <Tab label="By Person" />
                  </Tabs>
                </Box>

                {/* Tab 0: Summary Table */}
                {selectedTab === 0 && (
                  <TableContainer component={Paper} variant="outlined">
                    <Table>
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
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
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
                )}

                {/* Tab 1: Optimized Settlements */}
                {selectedTab === 1 && (
                  <Paper variant="outlined" sx={{ p: 3 }}>
                    <Typography variant="subtitle1" gutterBottom sx={{ fontWeight: 600, mb: 2 }}>
                      Optimized Settlement Plan ({optimizedSettlements.length} transaction{optimizedSettlements.length !== 1 ? 's' : ''})
                    </Typography>
                    {optimizedSettlements.length === 0 ? (
                      <Typography color="text.secondary" align="center" sx={{ py: 4 }}>
                        All settled! No payments needed.
                      </Typography>
                    ) : (
                      <List>
                        {optimizedSettlements.map((transaction, index) => (
                          <Fragment key={index}>
                            <ListItem sx={{ px: 0 }}>
                              <Box sx={{ width: '100%', display: 'flex', alignItems: 'center', gap: 2 }}>
                                <Chip 
                                  label={transaction.fromName} 
                                  color="error" 
                                  variant="outlined"
                                  sx={{ minWidth: 150 }}
                                />
                                <ArrowForwardIcon color="action" />
                                <Chip 
                                  label={transaction.toName} 
                                  color="success" 
                                  variant="outlined"
                                  sx={{ minWidth: 150 }}
                                />
                                <Box sx={{ ml: 'auto' }}>
                                  <Typography variant="h6" color="primary" sx={{ fontWeight: 600 }}>
                                    ₹{transaction.amount.toFixed(2)}
                                  </Typography>
                                </Box>
                              </Box>
                            </ListItem>
                            {index < optimizedSettlements.length - 1 && <Divider />}
                          </Fragment>
                        ))}
                      </List>
                    )}
                  </Paper>
                )}

                {/* Tab 2: By Person View */}
                {selectedTab === 2 && (
                  <Box>
                    <FormControl fullWidth sx={{ mb: 3 }}>
                      <InputLabel>Select Person</InputLabel>
                      <Select
                        value={selectedPerson || ''}
                        label="Select Person"
                        onChange={(e) => setSelectedPerson(e.target.value)}
                      >
                        {groups.map(group => (
                          <MenuItem key={group.id} value={group.id}>
                            {group.name}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>

                    {selectedPerson && (
                      <Paper variant="outlined" sx={{ p: 3 }}>
                        <Typography variant="h6" gutterBottom sx={{ fontWeight: 600, mb: 2 }}>
                          {groups.find(g => g.id === selectedPerson)?.name}'s Transactions
                        </Typography>

                        {(() => {
                          const { toPay, toReceive } = getPersonTransactions(selectedPerson);
                          const personBalance = settlement.find(s => s.id === selectedPerson)?.balance || 0;

                          return (
                            <>
                              <Box sx={{ mb: 3, p: 2, bgcolor: personBalance > 0 ? '#e8f5e9' : personBalance < 0 ? '#ffebee' : '#f5f5f5', borderRadius: 1 }}>
                                <Typography variant="body2" color="text.secondary">
                                  Net Balance
                                </Typography>
                                <Typography variant="h4" sx={{ fontWeight: 600, color: personBalance > 0 ? 'success.main' : personBalance < 0 ? 'error.main' : 'text.secondary' }}>
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
                                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                              <Typography>Pay to <strong>{transaction.toName}</strong></Typography>
                                              <Typography variant="h6" color="error.main" sx={{ fontWeight: 600 }}>
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
                                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                              <Typography>Receive from <strong>{transaction.fromName}</strong></Typography>
                                              <Typography variant="h6" color="success.main" sx={{ fontWeight: 600 }}>
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
                )}
              </>
            )}
          </CardContent>
        </Card>

        {/* Add Expense Section */}
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Typography variant="h6" gutterBottom sx={{ fontWeight: 600 }}>
              Add Expense
            </Typography>
            <Box component="form" onSubmit={handleAddExpense}>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6} md={3}>
                  <FormControl fullWidth>
                    <InputLabel>Who Paid?</InputLabel>
                    <Select
                      value={formData.paidBy}
                      label="Who Paid?"
                      onChange={(e) => setFormData({ ...formData, paidBy: e.target.value })}
                    >
                      {groups.map(group => (
                        <MenuItem key={group.id} value={group.id}>
                          {group.name}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
                
                <Grid item xs={12} sm={6} md={3}>
                  <TextField
                    fullWidth
                    label="Amount (₹)"
                    type="number"
                    value={formData.amount}
                    onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                    inputProps={{ step: "0.01", min: "0" }}
                    required
                  />
                </Grid>
                
                <Grid item xs={12} sm={6} md={3}>
                  <TextField
                    fullWidth
                    label="Description"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Optional"
                  />
                </Grid>
                
                <Grid item xs={12} sm={6} md={3}>
                  <Button
                    type="submit"
                    variant="contained"
                    fullWidth
                    size="large"
                    startIcon={<AddIcon />}
                    sx={{ height: '56px' }}
                  >
                    Add Expense
                  </Button>
                </Grid>
              </Grid>
            </Box>
          </CardContent>
        </Card>

        {/* Expense List */}
        <Card>
          <CardContent>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="h6" sx={{ fontWeight: 600 }}>
                Expense History
              </Typography>
              {expenses.length > 0 && (
                <Button
                  variant="contained"
                  color="error"
                  size="small"
                  onClick={handleReset}
                >
                  Reset All
                </Button>
              )}
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
                    <Paper key={expense.id} variant="outlined" sx={{ p: 2 }}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Box sx={{ flex: 1 }}>
                          <Typography variant="body1" sx={{ fontWeight: 500 }}>
                            {expense.description}
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            Paid by: {payer?.name || 'Unknown'}
                          </Typography>
                        </Box>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                          <Typography variant="h6" sx={{ fontWeight: 600 }}>
                            ₹{expense.amount.toFixed(2)}
                          </Typography>
                          <IconButton
                            color="error"
                            onClick={() => handleDeleteExpense(expense.id)}
                            size="small"
                          >
                            <DeleteIcon />
                          </IconButton>
                        </Box>
                      </Box>
                    </Paper>
                  );
                })}
              </Box>
            )}
          </CardContent>
        </Card>
      </Container>
    </Box>
  );
}

export default App;
