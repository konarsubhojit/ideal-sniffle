import { useState, useEffect } from 'react'

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
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-6xl mx-auto px-4 py-6">
          <h1 className="text-3xl font-bold text-gray-900">Expense Manager</h1>
          <p className="text-gray-600 mt-1">Track and split expenses fairly</p>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-8">
        {/* Error Message */}
        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
            {error}
          </div>
        )}

        {/* Dashboard - Who Owes Who */}
        <div className="bg-white rounded-lg shadow-sm border p-6 mb-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Dashboard - Who Owes Who</h2>
          
          {loading ? (
            <p className="text-gray-500 text-center py-8">Loading...</p>
          ) : (
            <>
              {/* Summary Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                <div className="bg-blue-50 rounded-lg p-4 border border-blue-100">
                  <p className="text-sm text-gray-600 mb-1">Total Expense</p>
                  <p className="text-2xl font-bold text-gray-900">₹{totalExpense.toFixed(2)}</p>
                </div>
                <div className="bg-purple-50 rounded-lg p-4 border border-purple-100">
                  <p className="text-sm text-gray-600 mb-1">Cost Per Head</p>
                  <p className="text-2xl font-bold text-gray-900">₹{baseUnitCost.toFixed(2)}</p>
                </div>
              </div>

              {/* Settlement Table */}
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Person</th>
                      <th className="px-4 py-3 text-center text-sm font-semibold text-gray-700">People</th>
                      <th className="px-4 py-3 text-right text-sm font-semibold text-gray-700">Paid</th>
                      <th className="px-4 py-3 text-right text-sm font-semibold text-gray-700">Share</th>
                      <th className="px-4 py-3 text-right text-sm font-semibold text-gray-700">Balance</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {settlement.map(group => (
                      <tr key={group.id} className="hover:bg-gray-50">
                        <td className="px-4 py-3 text-sm font-medium text-gray-900">
                          {group.name}
                          {group.type === "External" && (
                            <span className="ml-2 text-xs bg-yellow-100 text-yellow-800 px-2 py-0.5 rounded">Ext</span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-center text-sm text-gray-600">{group.count}</td>
                        <td className="px-4 py-3 text-right text-sm text-gray-900">₹{group.totalPaid.toFixed(2)}</td>
                        <td className="px-4 py-3 text-right text-sm text-gray-900">₹{group.fairShare.toFixed(2)}</td>
                        <td className="px-4 py-3 text-right text-sm font-semibold">
                          {group.balance > 0 ? (
                            <span className="text-green-600">
                              +₹{group.balance.toFixed(2)}
                            </span>
                          ) : group.balance < 0 ? (
                            <span className="text-red-600">
                              -₹{Math.abs(group.balance).toFixed(2)}
                            </span>
                          ) : (
                            <span className="text-gray-600">₹0.00</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </div>

        {/* Add Expense Section */}
        <div className="bg-white rounded-lg shadow-sm border p-6 mb-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Add Expense</h2>
          <form onSubmit={handleAddExpense} className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Who Paid?
              </label>
              <select
                value={formData.paidBy}
                onChange={(e) => setFormData({ ...formData, paidBy: parseInt(e.target.value) })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                {groups.map(group => (
                  <option key={group.id} value={group.id}>
                    {group.name}
                  </option>
                ))}
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Amount (₹)
              </label>
              <input
                type="number"
                value={formData.amount}
                onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                placeholder="0.00"
                step="0.01"
                min="0"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                required
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Description
              </label>
              <input
                type="text"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Optional"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            
            <div className="flex items-end">
              <button
                type="submit"
                className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors font-medium"
              >
                Add Expense
              </button>
            </div>
          </form>
        </div>

        {/* Expense List */}
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold text-gray-900">Expense History</h2>
            {expenses.length > 0 && (
              <button
                onClick={handleReset}
                className="bg-red-500 text-white py-1.5 px-4 rounded-lg hover:bg-red-600 transition-colors text-sm font-medium"
              >
                Reset All
              </button>
            )}
          </div>
          <div className="space-y-2">
            {expenses.length === 0 ? (
              <p className="text-gray-500 text-center py-8">No expenses yet. Add your first expense above.</p>
            ) : (
              expenses.map(expense => {
                const payer = groups.find(g => g.id === expense.paidBy);
                return (
                  <div key={expense.id} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg border">
                    <div className="flex-1">
                      <p className="font-medium text-gray-900">{expense.description}</p>
                      <p className="text-sm text-gray-600">Paid by: {payer?.name || 'Unknown'}</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <p className="font-semibold text-gray-900">₹{expense.amount.toFixed(2)}</p>
                      <button
                        onClick={() => handleDeleteExpense(expense.id)}
                        className="text-red-500 hover:text-red-700 font-medium text-lg"
                      >
                        ✕
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </main>
    </div>
  );
}

export default App
