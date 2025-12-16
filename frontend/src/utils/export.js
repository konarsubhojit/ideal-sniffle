// Export expenses to CSV
export function exportToCSV(expenses, groups) {
  // CSV headers
  const headers = ['Date', 'Description', 'Category', 'Paid By', 'Amount', 'Added By', 'Updated By'];
  
  // Convert expenses to CSV rows
  const rows = expenses.map(expense => {
    const payer = groups.find(g => g.id === expense.paidBy);
    return [
      new Date(expense.createdAt).toLocaleDateString(),
      `"${expense.description.replace(/"/g, '""')}"`, // Escape quotes
      expense.category || '',
      payer?.name || 'Unknown',
      expense.amount,
      expense.createdByName || '',
      expense.updatedByName || ''
    ];
  });
  
  // Combine headers and rows
  const csvContent = [
    headers.join(','),
    ...rows.map(row => row.join(','))
  ].join('\n');
  
  // Create download link
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  
  link.setAttribute('href', url);
  link.setAttribute('download', `expenses_${new Date().toISOString().split('T')[0]}.csv`);
  link.style.visibility = 'hidden';
  
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

// Calculate category statistics
export function getCategoryStats(expenses) {
  const stats = {};
  let total = 0;
  
  expenses.forEach(expense => {
    const category = expense.category || 'Uncategorized';
    const amount = parseFloat(expense.amount);
    
    if (!stats[category]) {
      stats[category] = {
        count: 0,
        total: 0
      };
    }
    
    stats[category].count += 1;
    stats[category].total += amount;
    total += amount;
  });
  
  // Calculate percentages
  Object.keys(stats).forEach(category => {
    stats[category].percentage = total > 0 ? (stats[category].total / total) * 100 : 0;
  });
  
  return { stats, total };
}

// Filter expenses
export function filterExpenses(expenses, filters) {
  return expenses.filter(expense => {
    // Search filter
    if (filters.search && !expense.description.toLowerCase().includes(filters.search.toLowerCase())) {
      return false;
    }
    
    // Paid by filter
    if (filters.paidBy && expense.paidBy !== parseInt(filters.paidBy)) {
      return false;
    }
    
    // Category filter
    if (filters.category && expense.category !== filters.category) {
      return false;
    }
    
    // Amount range filter
    const amount = parseFloat(expense.amount);
    if (filters.minAmount && amount < parseFloat(filters.minAmount)) {
      return false;
    }
    if (filters.maxAmount && amount > parseFloat(filters.maxAmount)) {
      return false;
    }
    
    return true;
  });
}
