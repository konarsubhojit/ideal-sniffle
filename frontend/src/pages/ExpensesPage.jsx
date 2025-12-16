import { useState, useEffect, useRef, useMemo } from 'react';
import { 
  Card, 
  CardContent, 
  Typography, 
  Box, 
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Button,
  IconButton,
  Tooltip,
} from '@mui/material';
import DownloadIcon from '@mui/icons-material/Download';
import { useInfiniteExpenses, useAddExpense, useUpdateExpense, useDeleteExpense } from '../hooks/useExpenses';
import { useGroups } from '../hooks/useExpenses';
import { useSnackbar } from '../contexts/SnackbarContext';
import { exportToCSV, filterExpenses } from '../utils/export';
import AddExpenseForm from '../components/AddExpenseForm';
import ExpenseList from '../components/ExpenseList';
import EditExpenseDialog from '../components/EditExpenseDialog';
import ExpenseFilters from '../components/ExpenseFilters';

function ExpensesPage() {
  const { data: groups = [], isLoading: groupsLoading } = useGroups();
  const showSnackbar = useSnackbar();
  
  const [formData, setFormData] = useState({
    paidBy: '',
    amount: '',
    description: '',
    category: ''
  });
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editingExpense, setEditingExpense] = useState(null);
  const [editFormData, setEditFormData] = useState({
    paidBy: '',
    amount: '',
    description: '',
    category: ''
  });
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [expenseToDelete, setExpenseToDelete] = useState(null);
  const [filters, setFilters] = useState({
    search: '',
    paidBy: '',
    category: '',
    minAmount: '',
    maxAmount: '',
    startDate: '',
    endDate: '',
  });

  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading: expensesLoading,
    error: expensesError
  } = useInfiniteExpenses(20);
  
  const addExpense = useAddExpense();
  const updateExpense = useUpdateExpense();
  const deleteExpense = useDeleteExpense();

  // Infinite scroll
  const observerTarget = useRef(null);

  // Set default paidBy when groups first load
  useEffect(() => {
    if (!groupsLoading && groups.length > 0 && !formData.paidBy) {
      setFormData(prev => ({ ...prev, paidBy: groups[0].id }));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [groupsLoading, groups]);

  useEffect(() => {
    const observer = new IntersectionObserver(
      entries => {
        if (entries[0].isIntersecting && hasNextPage && !isFetchingNextPage) {
          fetchNextPage();
        }
      },
      { threshold: 1 }
    );

    const currentTarget = observerTarget.current;
    if (currentTarget) {
      observer.observe(currentTarget);
    }

    return () => {
      if (currentTarget) {
        observer.unobserve(currentTarget);
      }
    };
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  const handleAddExpense = async (e) => {
    e.preventDefault();
    if (!formData.amount || formData.amount <= 0) return;
    
    try {
      await addExpense.mutateAsync({
        paidBy: formData.paidBy,
        amount: parseFloat(formData.amount),
        description: formData.description || 'No description',
        category: formData.category || null
      });
      
      setFormData({ ...formData, amount: '', description: '', category: '' });
      showSnackbar('Expense added successfully!', 'success');
    } catch (error) {
      console.error('Error adding expense:', error);
      showSnackbar('Failed to add expense. Please try again.', 'error');
    }
  };

  const handleEditExpense = (expense) => {
    setEditingExpense(expense);
    setEditFormData({
      paidBy: expense.paidBy,
      amount: expense.amount.toString(),
      description: expense.description,
      category: expense.category || ''
    });
    setEditDialogOpen(true);
  };

  const handleSaveEdit = async () => {
    if (!editFormData.amount || editFormData.amount <= 0) return;
    
    try {
      await updateExpense.mutateAsync({
        id: editingExpense.id,
        paidBy: editFormData.paidBy,
        amount: parseFloat(editFormData.amount),
        description: editFormData.description || 'No description',
        category: editFormData.category || null
      });
      
      setEditDialogOpen(false);
      setEditingExpense(null);
      showSnackbar('Expense updated successfully!', 'success');
    } catch (error) {
      console.error('Error updating expense:', error);
      showSnackbar('Failed to update expense. Please try again.', 'error');
    }
  };

  const handleDeleteClick = (id) => {
    setExpenseToDelete(id);
    setDeleteConfirmOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!expenseToDelete) return;
    
    try {
      await deleteExpense.mutateAsync(expenseToDelete);
      setDeleteConfirmOpen(false);
      setExpenseToDelete(null);
      showSnackbar('Expense deleted successfully!', 'success');
    } catch (error) {
      console.error('Error deleting expense:', error);
      showSnackbar('Failed to delete expense. Please try again.', 'error');
    }
  };

  // Flatten all pages of expenses
  const allExpenses = data?.pages?.flatMap(page => page.expenses) || [];
  
  // Apply filters
  const filteredExpenses = useMemo(() => {
    return filterExpenses(allExpenses, filters);
  }, [allExpenses, filters]);

  const handleExport = () => {
    exportToCSV(filteredExpenses, groups);
    showSnackbar('Expenses exported to CSV!', 'success');
  };

  const loading = expensesLoading || groupsLoading;

  if (expensesError) {
    return (
      <Box sx={{ textAlign: 'center', py: 4 }}>
        <Typography variant="h6" color="error">
          Failed to load expenses. Please try again.
        </Typography>
      </Box>
    );
  }

  return (
    <>
      <Card sx={{ mb: 3, boxShadow: 2 }}>
        <CardContent>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Typography variant="h6" gutterBottom sx={{ fontWeight: 600, mb: 0 }}>
              Add Expense
            </Typography>
            {allExpenses.length > 0 && (
              <Tooltip title="Export to CSV">
                <IconButton color="primary" onClick={handleExport} size="small">
                  <DownloadIcon />
                </IconButton>
              </Tooltip>
            )}
          </Box>
          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
              <CircularProgress />
            </Box>
          ) : (
            <AddExpenseForm 
              groups={groups}
              formData={formData}
              onFormChange={setFormData}
              onSubmit={handleAddExpense}
            />
          )}
        </CardContent>
      </Card>

      {!loading && allExpenses.length > 0 && (
        <ExpenseFilters 
          groups={groups}
          onFilterChange={setFilters}
          activeFilters={filters}
        />
      )}

      <Card sx={{ boxShadow: 2 }}>
        <CardContent>
          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
              <CircularProgress />
            </Box>
          ) : (
            <>
              <ExpenseList
                expenses={filteredExpenses}
                groups={groups}
                onEdit={handleEditExpense}
                onDelete={handleDeleteClick}
              />
              
              {/* Infinite scroll trigger */}
              <div ref={observerTarget} style={{ height: '20px', margin: '20px 0' }}>
                {isFetchingNextPage && (
                  <Box sx={{ display: 'flex', justifyContent: 'center', py: 2 }}>
                    <CircularProgress size={24} />
                  </Box>
                )}
              </div>
            </>
          )}
        </CardContent>
      </Card>

      <EditExpenseDialog
        open={editDialogOpen}
        groups={groups}
        formData={editFormData}
        onFormChange={setEditFormData}
        onSave={handleSaveEdit}
        onClose={() => setEditDialogOpen(false)}
      />

      <Dialog
        open={deleteConfirmOpen}
        onClose={() => setDeleteConfirmOpen(false)}
      >
        <DialogTitle>Confirm Delete</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to delete this expense? This action cannot be undone.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteConfirmOpen(false)}>
            Cancel
          </Button>
          <Button onClick={handleConfirmDelete} color="error" variant="contained">
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}

export default ExpensesPage;
