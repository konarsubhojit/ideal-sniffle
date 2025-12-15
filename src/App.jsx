import { useState } from 'react'

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
  const [formData, setFormData] = useState({
    paidBy: groups[0].id,
    amount: '',
    description: ''
  });

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

  const handleAddExpense = (e) => {
    e.preventDefault();
    if (!formData.amount || formData.amount <= 0) return;
    
    const newExpense = {
      id: Date.now(),
      paidBy: formData.paidBy,
      amount: parseFloat(formData.amount),
      description: formData.description || 'No description'
    };
    
    setExpenses([...expenses, newExpense]);
    setFormData({ ...formData, amount: '', description: '' });
  };

  const handleDeleteExpense = (id) => {
    setExpenses(expenses.filter(exp => exp.id !== id));
  };

  const handleReset = () => {
    if (window.confirm('Are you sure you want to reset all data?')) {
      setExpenses([]);
      setFormData({ paidBy: groups[0].id, amount: '', description: '' });
    }
  };

  const settlement = calculateSettlement();
  const totalExpense = expenses.reduce((sum, exp) => sum + exp.amount, 0);
  const baseUnitCost = totalExpense / TOTAL_BILLABLE_HEADS;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-8 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-800 mb-2">Family Picnic Expense Manager</h1>
          <p className="text-gray-600">Track and split expenses fairly</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          {/* Expense Input Form */}
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h2 className="text-2xl font-semibold text-gray-800 mb-4">Add Expense</h2>
            <form onSubmit={handleAddExpense} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Who Paid?
                </label>
                <select
                  value={formData.paidBy}
                  onChange={(e) => setFormData({ ...formData, paidBy: parseInt(e.target.value) })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  {groups.map(group => (
                    <option key={group.id} value={group.id}>
                      {group.name} ({group.count} people)
                    </option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Amount (₹)
                </label>
                <input
                  type="number"
                  value={formData.amount}
                  onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                  placeholder="Enter amount"
                  step="0.01"
                  min="0"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Description
                </label>
                <input
                  type="text"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="e.g., Bus, Mutton, Snacks"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              
              <button
                type="submit"
                className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors font-medium"
              >
                Add Expense
              </button>
            </form>
          </div>

          {/* Expense Log */}
          <div className="bg-white rounded-lg shadow-lg p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-2xl font-semibold text-gray-800">Expense Log</h2>
              {expenses.length > 0 && (
                <button
                  onClick={handleReset}
                  className="bg-red-500 text-white py-1 px-3 rounded-lg hover:bg-red-600 transition-colors text-sm font-medium"
                >
                  Reset All
                </button>
              )}
            </div>
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {expenses.length === 0 ? (
                <p className="text-gray-500 text-center py-8">No expenses added yet</p>
              ) : (
                expenses.map(expense => {
                  const payer = groups.find(g => g.id === expense.paidBy);
                  return (
                    <div key={expense.id} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                      <div className="flex-1">
                        <p className="font-medium text-gray-800">{expense.description}</p>
                        <p className="text-sm text-gray-600">Paid by: {payer.name}</p>
                      </div>
                      <div className="flex items-center gap-3">
                        <p className="font-semibold text-gray-800">₹{expense.amount.toFixed(2)}</p>
                        <button
                          onClick={() => handleDeleteExpense(expense.id)}
                          className="text-red-500 hover:text-red-700 font-medium"
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
        </div>

        {/* Live Dashboard */}
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h2 className="text-2xl font-semibold text-gray-800 mb-4">Live Settlement Dashboard</h2>
          
          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-lg p-6 text-white">
              <p className="text-sm font-medium opacity-90">Total Picnic Cost</p>
              <p className="text-3xl font-bold">₹{totalExpense.toFixed(2)}</p>
            </div>
            <div className="bg-gradient-to-r from-purple-500 to-purple-600 rounded-lg p-6 text-white">
              <p className="text-sm font-medium opacity-90">Cost Per Head (Global Base)</p>
              <p className="text-3xl font-bold">₹{baseUnitCost.toFixed(2)}</p>
            </div>
          </div>

          {/* Settlement Table */}
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-100">
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Group Head</th>
                  <th className="px-4 py-3 text-center text-sm font-semibold text-gray-700">People Count</th>
                  <th className="px-4 py-3 text-right text-sm font-semibold text-gray-700">Total Paid</th>
                  <th className="px-4 py-3 text-right text-sm font-semibold text-gray-700">Fair Share</th>
                  <th className="px-4 py-3 text-right text-sm font-semibold text-gray-700">Balance</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {settlement.map(group => (
                  <tr key={group.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-sm font-medium text-gray-800">
                      {group.name}
                      {group.type === "External" && (
                        <span className="ml-2 text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded">External</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-center text-sm text-gray-600">{group.count}</td>
                    <td className="px-4 py-3 text-right text-sm text-gray-800">₹{group.totalPaid.toFixed(2)}</td>
                    <td className="px-4 py-3 text-right text-sm text-gray-800">₹{group.fairShare.toFixed(2)}</td>
                    <td className="px-4 py-3 text-right text-sm font-bold">
                      {group.balance > 0 ? (
                        <span className="text-green-600">
                          +₹{group.balance.toFixed(2)} (To Receive)
                        </span>
                      ) : group.balance < 0 ? (
                        <span className="text-red-600">
                          -₹{Math.abs(group.balance).toFixed(2)} (To Pay)
                        </span>
                      ) : (
                        <span className="text-gray-600">₹0.00 (Settled)</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}

export default App
