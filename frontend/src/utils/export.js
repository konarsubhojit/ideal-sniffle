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
    
    // Date range filter
    if (filters.startDate || filters.endDate) {
      const expenseDate = new Date(expense.createdAt);
      
      if (filters.startDate) {
        const startDate = new Date(filters.startDate);
        startDate.setHours(0, 0, 0, 0);
        if (expenseDate < startDate) {
          return false;
        }
      }
      
      if (filters.endDate) {
        const endDate = new Date(filters.endDate);
        endDate.setHours(23, 59, 59, 999);
        if (expenseDate > endDate) {
          return false;
        }
      }
    }
    
    return true;
  });
}

// Export settlement report as simple text-based PDF content
export function exportSettlementToPDF(settlement, optimizedSettlements) {
  // Create a simple HTML content for printing/PDF
  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <title>Settlement Report - ${new Date().toLocaleDateString()}</title>
      <style>
        body { font-family: Arial, sans-serif; padding: 20px; }
        h1 { color: #1976d2; }
        table { width: 100%; border-collapse: collapse; margin: 20px 0; }
        th, td { border: 1px solid #ddd; padding: 12px; text-align: left; }
        th { background-color: #1976d2; color: white; }
        .positive { color: green; font-weight: bold; }
        .negative { color: red; font-weight: bold; }
        .zero { color: gray; }
        .summary { background-color: #f5f5f5; padding: 15px; margin: 20px 0; border-radius: 5px; }
      </style>
    </head>
    <body>
      <h1>Settlement Report</h1>
      <p>Generated on: ${new Date().toLocaleString()}</p>
      
      <h2>Settlement Summary</h2>
      <table>
        <thead>
          <tr>
            <th>Person/Group</th>
            <th>Total Paid</th>
            <th>Fair Share</th>
            <th>Balance</th>
          </tr>
        </thead>
        <tbody>
          ${settlement.map(s => `
            <tr>
              <td>${s.name}</td>
              <td>₹${s.totalPaid.toFixed(2)}</td>
              <td>₹${s.fairShare.toFixed(2)}</td>
              <td class="${s.balance > 0 ? 'positive' : s.balance < 0 ? 'negative' : 'zero'}">
                ₹${s.balance.toFixed(2)}
              </td>
            </tr>
          `).join('')}
        </tbody>
      </table>
      
      <h2>Optimized Payment Plan</h2>
      ${optimizedSettlements.length === 0 ? '<p>All settled up! 🎉</p>' : `
        <table>
          <thead>
            <tr>
              <th>From</th>
              <th>To</th>
              <th>Amount</th>
            </tr>
          </thead>
          <tbody>
            ${optimizedSettlements.map(t => `
              <tr>
                <td>${t.fromName}</td>
                <td>${t.toName}</td>
                <td>₹${t.amount.toFixed(2)}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      `}
      
      <div class="summary">
        <p><strong>Total Transactions Needed:</strong> ${optimizedSettlements.length}</p>
        <p><strong>Total Amount to Settle:</strong> ₹${optimizedSettlements.reduce((sum, t) => sum + t.amount, 0).toFixed(2)}</p>
      </div>
    </body>
    </html>
  `;
  
  // Open in new window for printing
  const printWindow = window.open('', '_blank');
  printWindow.document.write(htmlContent);
  printWindow.document.close();
  printWindow.focus();
  
  // Trigger print dialog after a short delay
  setTimeout(() => {
    printWindow.print();
  }, 250);
}
