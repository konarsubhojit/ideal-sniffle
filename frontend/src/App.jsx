import { useState, useEffect } from 'react';
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
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import AddIcon from '@mui/icons-material/Add';

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
  const totalExpense = expenses.reduce((sum, exp) => sum + exp.amount, 0);
  const baseUnitCost = totalExpense / TOTAL_BILLABLE_HEADS;

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

        {/* Dashboard - Who Owes Who */}
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

                {/* Settlement Table */}
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
