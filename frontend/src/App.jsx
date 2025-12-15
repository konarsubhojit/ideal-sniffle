import { useState, useEffect, Fragment, useCallback } from 'react';
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
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Avatar,
  Menu,
  MenuItem as MenuItemComponent,
  ListItemIcon,
  Snackbar,
  Badge,
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import AddIcon from '@mui/icons-material/Add';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import EditIcon from '@mui/icons-material/Edit';
import HistoryIcon from '@mui/icons-material/History';
import LogoutIcon from '@mui/icons-material/Logout';
import LoginIcon from '@mui/icons-material/Login';
import SaveIcon from '@mui/icons-material/Save';
import CancelIcon from '@mui/icons-material/Cancel';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

function App() {
  // State
  const [expenses, setExpenses] = useState([]);
  const [groups, setGroups] = useState([]);
  const [settlement, setSettlement] = useState([]);
  const [optimizedSettlements, setOptimizedSettlements] = useState([]);
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [selectedTab, setSelectedTab] = useState(0);
  const [selectedPerson, setSelectedPerson] = useState(null);
  const [user, setUser] = useState(null);
  const [userMenuAnchor, setUserMenuAnchor] = useState(null);
  const [activityDialogOpen, setActivityDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editingExpense, setEditingExpense] = useState(null);
  
  const [formData, setFormData] = useState({
    paidBy: '',
    amount: '',
    description: ''
  });

  const [editFormData, setEditFormData] = useState({
    paidBy: '',
    amount: '',
    description: ''
  });

  // Constants
  const TOTAL_BILLABLE_HEADS = 27;

  // Fetch user authentication status
  useEffect(() => {
    checkAuth();
  }, []);

  // Fetch data when authenticated
  useEffect(() => {
    if (user) {
      fetchData();
    }
  }, [user, fetchData]);

  const checkAuth = async () => {
    try {
      const response = await fetch(`${API_URL}/api/auth/user`, {
        credentials: 'include'
      });
      if (response.ok) {
        const userData = await response.json();
        setUser(userData);
      } else {
        setUser(null);
      }
    } catch (error) {
      console.error('Error checking auth:', error);
      setUser(null);
    }
  };

  const fetchGroups = useCallback(async () => {
    const response = await fetch(`${API_URL}/api/groups`);
    if (!response.ok) throw new Error('Failed to fetch groups');
    const data = await response.json();
    setGroups(data);
    // Set default paidBy only on first load
    setFormData(prev => {
      if (!prev.paidBy && data.length > 0) {
        return { ...prev, paidBy: data[0].id };
      }
      return prev;
    });
  }, []);

  const fetchExpenses = useCallback(async () => {
    const response = await fetch(`${API_URL}/api/expenses`);
    if (!response.ok) throw new Error('Failed to fetch expenses');
    const data = await response.json();
    const normalizedData = data.map(exp => ({
      ...exp,
      amount: parseFloat(exp.amount)
    }));
    setExpenses(normalizedData);
  }, []);

  const fetchSettlement = useCallback(async () => {
    const response = await fetch(`${API_URL}/api/settlement`);
    if (!response.ok) throw new Error('Failed to fetch settlement');
    const data = await response.json();
    setSettlement(data);
  }, []);

  const fetchOptimizedSettlements = useCallback(async () => {
    const response = await fetch(`${API_URL}/api/settlement/optimized`);
    if (!response.ok) throw new Error('Failed to fetch optimized settlements');
    const data = await response.json();
    setOptimizedSettlements(data);
  }, []);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      await Promise.all([
        fetchGroups(),
        fetchExpenses(),
        fetchSettlement(),
        fetchOptimizedSettlements()
      ]);
      setError(null);
    } catch (error) {
      console.error('Error fetching data:', error);
      setError('Failed to load data. Make sure the backend server is running.');
    } finally {
      setLoading(false);
    }
  }, [fetchGroups, fetchExpenses, fetchSettlement, fetchOptimizedSettlements]);

  const fetchActivities = async () => {
    try {
      const response = await fetch(`${API_URL}/api/activity?limit=50`, {
        credentials: 'include'
      });
      if (!response.ok) throw new Error('Failed to fetch activities');
      const data = await response.json();
      setActivities(data);
    } catch (error) {
      console.error('Error fetching activities:', error);
    }
  };

  const handleLogin = () => {
    window.location.href = `${API_URL}/api/auth/google`;
  };

  const handleLogout = async () => {
    try {
      await fetch(`${API_URL}/api/auth/logout`, {
        credentials: 'include'
      });
      setUser(null);
      setUserMenuAnchor(null);
      window.location.reload();
    } catch (error) {
      console.error('Error logging out:', error);
    }
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
        credentials: 'include',
        body: JSON.stringify({
          paidBy: formData.paidBy,
          amount: parseFloat(formData.amount),
          description: formData.description || 'No description'
        }),
      });
      
      if (!response.ok) throw new Error('Failed to add expense');
      
      await fetchData();
      setFormData({ ...formData, amount: '', description: '' });
      setSuccess('Expense added successfully!');
      setError(null);
    } catch (error) {
      console.error('Error adding expense:', error);
      setError('Failed to add expense. Please try again.');
    }
  };

  const handleEditExpense = (expense) => {
    setEditingExpense(expense);
    setEditFormData({
      paidBy: expense.paidBy,
      amount: expense.amount.toString(),
      description: expense.description
    });
    setEditDialogOpen(true);
  };

  const handleSaveEdit = async () => {
    if (!editFormData.amount || editFormData.amount <= 0) return;
    
    try {
      const response = await fetch(`${API_URL}/api/expenses/${editingExpense.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          paidBy: editFormData.paidBy,
          amount: parseFloat(editFormData.amount),
          description: editFormData.description || 'No description'
        }),
      });
      
      if (!response.ok) throw new Error('Failed to update expense');
      
      await fetchData();
      setEditDialogOpen(false);
      setEditingExpense(null);
      setSuccess('Expense updated successfully!');
      setError(null);
    } catch (error) {
      console.error('Error updating expense:', error);
      setError('Failed to update expense. Please try again.');
    }
  };

  const handleDeleteExpense = async (id) => {
    if (!window.confirm('Are you sure you want to delete this expense?')) return;
    
    try {
      const response = await fetch(`${API_URL}/api/expenses/${id}`, {
        method: 'DELETE',
        credentials: 'include'
      });
      
      if (!response.ok) throw new Error('Failed to delete expense');
      
      await fetchData();
      setSuccess('Expense deleted successfully!');
      setError(null);
    } catch (error) {
      console.error('Error deleting expense:', error);
      setError('Failed to delete expense. Please try again.');
    }
  };

  const handleReset = async () => {
    if (!window.confirm('Are you sure you want to reset all data?')) return;
    
    try {
      const response = await fetch(`${API_URL}/api/expenses`, {
        method: 'DELETE',
        credentials: 'include'
      });
      
      if (!response.ok) throw new Error('Failed to reset expenses');
      
      await fetchData();
      setFormData({ paidBy: groups[0]?.id || '', amount: '', description: '' });
      setSuccess('All expenses reset successfully!');
      setError(null);
    } catch (error) {
      console.error('Error resetting expenses:', error);
      setError('Failed to reset expenses. Please try again.');
    }
  };

  const handleOpenActivityLog = async () => {
    await fetchActivities();
    setActivityDialogOpen(true);
  };

  const totalExpense = expenses.reduce((sum, exp) => sum + exp.amount, 0);
  const baseUnitCost = totalExpense / TOTAL_BILLABLE_HEADS;

  // Get transactions for a specific person
  const getPersonTransactions = (personId) => {
    const toPay = optimizedSettlements.filter(t => t.from === personId);
    const toReceive = optimizedSettlements.filter(t => t.to === personId);
    return { toPay, toReceive };
  };

  const formatActivityAction = (activity) => {
    switch (activity.action) {
      case 'CREATE':
        return 'added an expense';
      case 'UPDATE':
        return 'updated an expense';
      case 'DELETE':
        return 'deleted an expense';
      case 'DELETE_ALL':
        return 'reset all expenses';
      default:
        return activity.action.toLowerCase();
    }
  };

  // If not authenticated, show login screen
  if (!user) {
    return (
      <Box sx={{ flexGrow: 1, bgcolor: '#f5f5f5', minHeight: '100vh' }}>
        <AppBar position="static" color="primary" elevation={1}>
          <Toolbar>
            <Typography variant="h5" component="h1" sx={{ fontWeight: 600, flexGrow: 1 }}>
              Expense Manager
            </Typography>
          </Toolbar>
        </AppBar>
        
        <Container maxWidth="sm" sx={{ mt: 8 }}>
          <Paper sx={{ p: 4, textAlign: 'center' }}>
            <Typography variant="h5" gutterBottom>
              Welcome to Expense Manager
            </Typography>
            <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
              Please sign in with your Google account to continue
            </Typography>
            <Button
              variant="contained"
              size="large"
              startIcon={<LoginIcon />}
              onClick={handleLogin}
            >
              Sign in with Google
            </Button>
          </Paper>
        </Container>
      </Box>
    );
  }

  return (
    <Box sx={{ flexGrow: 1, bgcolor: '#f5f5f5', minHeight: '100vh' }}>
      {/* Header */}
      <AppBar position="static" color="primary" elevation={1}>
        <Toolbar>
          <Box sx={{ flexGrow: 1 }}>
            <Typography variant="h5" component="h1" sx={{ fontWeight: 600 }}>
              Expense Manager
            </Typography>
            <Typography variant="body2" sx={{ opacity: 0.9 }}>
              Track and split expenses fairly
            </Typography>
          </Box>
          
          <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
            <IconButton
              color="inherit"
              onClick={handleOpenActivityLog}
              title="View Activity Log"
            >
              <Badge badgeContent={activities.length} color="error">
                <HistoryIcon />
              </Badge>
            </IconButton>
            
            <IconButton
              onClick={(e) => setUserMenuAnchor(e.currentTarget)}
              sx={{ p: 0 }}
            >
              <Avatar src={user.picture} alt={user.name}>
                {user.name?.charAt(0)}
              </Avatar>
            </IconButton>
            
            <Menu
              anchorEl={userMenuAnchor}
              open={Boolean(userMenuAnchor)}
              onClose={() => setUserMenuAnchor(null)}
            >
              <MenuItemComponent disabled>
                <Typography variant="body2">{user.name}</Typography>
              </MenuItemComponent>
              <MenuItemComponent disabled>
                <Typography variant="caption" color="text.secondary">{user.email}</Typography>
              </MenuItemComponent>
              <Divider />
              <MenuItemComponent onClick={handleLogout}>
                <ListItemIcon>
                  <LogoutIcon fontSize="small" />
                </ListItemIcon>
                Logout
              </MenuItemComponent>
            </Menu>
          </Box>
        </Toolbar>
      </AppBar>

      <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
        {/* Success/Error Messages */}
        <Snackbar
          open={!!success}
          autoHideDuration={3000}
          onClose={() => setSuccess(null)}
        >
          <Alert severity="success" onClose={() => setSuccess(null)}>
            {success}
          </Alert>
        </Snackbar>

        {error && (
          <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
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
                          {expense.createdByName && (
                            <Typography variant="caption" color="text.secondary">
                              Added by: {expense.createdByName}
                              {expense.updatedByName && expense.createdByName !== expense.updatedByName && (
                                <> • Edited by: {expense.updatedByName}</>
                              )}
                            </Typography>
                          )}
                        </Box>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                          <Typography variant="h6" sx={{ fontWeight: 600 }}>
                            ₹{expense.amount.toFixed(2)}
                          </Typography>
                          <IconButton
                            color="primary"
                            onClick={() => handleEditExpense(expense)}
                            size="small"
                            title="Edit expense"
                          >
                            <EditIcon />
                          </IconButton>
                          <IconButton
                            color="error"
                            onClick={() => handleDeleteExpense(expense.id)}
                            size="small"
                            title="Delete expense"
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

      {/* Edit Expense Dialog */}
      <Dialog open={editDialogOpen} onClose={() => setEditDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Edit Expense</DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 2, display: 'flex', flexDirection: 'column', gap: 2 }}>
            <FormControl fullWidth>
              <InputLabel>Who Paid?</InputLabel>
              <Select
                value={editFormData.paidBy}
                label="Who Paid?"
                onChange={(e) => setEditFormData({ ...editFormData, paidBy: e.target.value })}
              >
                {groups.map(group => (
                  <MenuItem key={group.id} value={group.id}>
                    {group.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            
            <TextField
              fullWidth
              label="Amount (₹)"
              type="number"
              value={editFormData.amount}
              onChange={(e) => setEditFormData({ ...editFormData, amount: e.target.value })}
              inputProps={{ step: "0.01", min: "0" }}
              required
            />
            
            <TextField
              fullWidth
              label="Description"
              value={editFormData.description}
              onChange={(e) => setEditFormData({ ...editFormData, description: e.target.value })}
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditDialogOpen(false)} startIcon={<CancelIcon />}>
            Cancel
          </Button>
          <Button onClick={handleSaveEdit} variant="contained" startIcon={<SaveIcon />}>
            Save Changes
          </Button>
        </DialogActions>
      </Dialog>

      {/* Activity Log Dialog */}
      <Dialog open={activityDialogOpen} onClose={() => setActivityDialogOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <HistoryIcon />
            Activity Log
          </Box>
        </DialogTitle>
        <DialogContent>
          {activities.length === 0 ? (
            <Typography color="text.secondary" align="center" sx={{ py: 4 }}>
              No activities yet.
            </Typography>
          ) : (
            <List>
              {activities.map((activity, index) => (
                <Fragment key={activity.id}>
                  <ListItem alignItems="flex-start" sx={{ px: 0 }}>
                    <Box sx={{ display: 'flex', gap: 2, width: '100%' }}>
                      <Avatar src={activity.userPicture} sx={{ width: 40, height: 40 }}>
                        {activity.userName?.charAt(0)}
                      </Avatar>
                      <Box sx={{ flex: 1 }}>
                        <Typography variant="body2">
                          <strong>{activity.userName || 'Unknown User'}</strong> {formatActivityAction(activity)}
                        </Typography>
                        {activity.details && (
                          <Typography variant="caption" color="text.secondary" component="div">
                            {activity.action === 'CREATE' && (
                              <>Amount: ₹{activity.details.amount}, Paid by ID: {activity.details.paidBy}</>
                            )}
                            {activity.action === 'UPDATE' && (
                              <>Updated from ₹{activity.details.old?.amount} to ₹{activity.details.new?.amount}</>
                            )}
                            {activity.action === 'DELETE' && (
                              <>Amount: ₹{activity.details.amount}</>
                            )}
                            {activity.action === 'DELETE_ALL' && (
                              <>Deleted {activity.details.count} expenses</>
                            )}
                          </Typography>
                        )}
                        <Typography variant="caption" color="text.secondary">
                          {new Date(activity.createdAt).toLocaleString()}
                        </Typography>
                      </Box>
                    </Box>
                  </ListItem>
                  {index < activities.length - 1 && <Divider />}
                </Fragment>
              ))}
            </List>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setActivityDialogOpen(false)}>Close</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

export default App;
