import { useState, useEffect, useRef } from 'react';
import { Card, CardContent, Typography, Alert, Box, CircularProgress } from '@mui/material';
import { useInfiniteExpenses, useAddExpense, useUpdateExpense, useDeleteExpense, useDeleteAllExpenses } from '../hooks/useExpenses';
import { useGroups } from '../hooks/useExpenses';
import AddExpenseForm from '../components/AddExpenseForm';
import ExpenseList from '../components/ExpenseList';
import EditExpenseDialog from '../components/EditExpenseDialog';

function ExpensesPage() {
  const { data: groups = [], isLoading: groupsLoading } = useGroups();
  
  const [formData, setFormData] = useState({
    paidBy: '',
    amount: '',
    description: ''
  });
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editingExpense, setEditingExpense] = useState(null);
  const [editFormData, setEditFormData] = useState({
    paidBy: '',
    amount: '',
    description: ''
  });
  const [success, setSuccess] = useState(null);
  const [error, setError] = useState(null);

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
  const deleteAllExpenses = useDeleteAllExpenses();

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
        description: formData.description || 'No description'
      });
      
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
      await updateExpense.mutateAsync({
        id: editingExpense.id,
        paidBy: editFormData.paidBy,
        amount: parseFloat(editFormData.amount),
        description: editFormData.description || 'No description'
      });
      
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
      await deleteExpense.mutateAsync(id);
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
      await deleteAllExpenses.mutateAsync();
      setFormData({ paidBy: groups[0]?.id || '', amount: '', description: '' });
      setSuccess('All expenses reset successfully!');
      setError(null);
    } catch (error) {
      console.error('Error resetting expenses:', error);
      setError('Failed to reset expenses. Please try again.');
    }
  };

  // Flatten all pages of expenses
  const allExpenses = data?.pages?.flatMap(page => page.expenses) || [];

  const loading = expensesLoading || groupsLoading;

  if (expensesError) {
    return (
      <Alert severity="error" sx={{ mb: 3 }}>
        Failed to load expenses. Please try again.
      </Alert>
    );
  }

  return (
    <>
      {success && (
        <Alert severity="success" sx={{ mb: 3 }} onClose={() => setSuccess(null)}>
          {success}
        </Alert>
      )}

      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom sx={{ fontWeight: 600 }}>
            Add Expense
          </Typography>
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

      <Card>
        <CardContent>
          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
              <CircularProgress />
            </Box>
          ) : (
            <>
              <ExpenseList
                expenses={allExpenses}
                groups={groups}
                onEdit={handleEditExpense}
                onDelete={handleDeleteExpense}
                onReset={handleReset}
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
    </>
  );
}

export default ExpensesPage;
