const GROUPS = [
  { id: 1, name: "Other Family", count: 3, type: "External" },
  { id: 2, name: "Subhojit Konar", count: 3, type: "Internal" },
  { id: 3, name: "Ravi Ranjan Verma", count: 3, type: "Internal" },
  { id: 4, name: "Abhijit Koner", count: 2, type: "Internal" },
  { id: 5, name: "Apurba Samanta", count: 2, type: "Internal" },
  { id: 6, name: "Gopal Samanta", count: 2, type: "Internal" },
  { id: 7, name: "Anupam Chakraborty", count: 2, type: "Internal" },
  { id: 8, name: "Arindra Sahana", count: 2, type: "Internal" },
  { id: 9, name: "Nupur Mondol", count: 2, type: "Internal" },
];

// Total people: 28 (21 from groups above + 7 additional)
// Billable heads: 27 (one 5-year-old is free)
// Main Family: 18 paying members subsidizing 24 people total (18 paying + 6 non-paying)
const TOTAL_BILLABLE_HEADS = 27;
const MAIN_FAMILY_PAYING_COUNT = 18;

export function getGroups() {
  return GROUPS;
}

export function calculateSettlement(expenses) {
  const totalExpense = expenses.reduce((sum, exp) => sum + parseFloat(exp.amount), 0);
  
  // Base unit cost per billable head
  const baseUnitCost = totalExpense / TOTAL_BILLABLE_HEADS;
  
  // External group (Other Family) pays for their 3 members
  const externalFairShare = baseUnitCost * 3;
  
  // Remaining expense for Main Family (Internal groups)
  const mainFamilyTotalCost = totalExpense - externalFairShare;
  
  // Main Family fair share per paying member (18 paying members split the remaining cost)
  const mainFamilyPerPayingMember = mainFamilyTotalCost / MAIN_FAMILY_PAYING_COUNT;
  
  return GROUPS.map(group => {
    const totalPaid = expenses
      .filter(exp => exp.paidBy === group.id)
      .reduce((sum, exp) => sum + parseFloat(exp.amount), 0);
    
    let fairShare;
    if (group.type === 'External') {
      // External group pays based on their headcount
      fairShare = externalFairShare;
    } else {
      // Internal groups: each paying member pays their share
      // The group head pays for all their members at the rate of mainFamilyPerPayingMember
      fairShare = mainFamilyPerPayingMember * group.count;
    }
    
    const balance = totalPaid - fairShare;
    
    return {
      ...group,
      totalPaid,
      fairShare,
      balance
    };
  });
}

export function calculateOptimizedSettlements(expenses) {
  const settlement = calculateSettlement(expenses);
  
  const creditors = settlement
    .filter(s => s.balance > 0.01)
    .map(s => ({ id: s.id, name: s.name, amount: s.balance }));
  
  const debtors = settlement
    .filter(s => s.balance < -0.01)
    .map(s => ({ id: s.id, name: s.name, amount: Math.abs(s.balance) }));
  
  const transactions = [];
  let creditorIndex = 0;
  let debtorIndex = 0;
  
  while (creditorIndex < creditors.length && debtorIndex < debtors.length) {
    const creditAmount = creditors[creditorIndex].amount;
    const debtAmount = debtors[debtorIndex].amount;
    const settledAmount = Math.min(creditAmount, debtAmount);
    
    if (settledAmount > 0.01) {
      transactions.push({
        from: debtors[debtorIndex].id,
        fromName: debtors[debtorIndex].name,
        to: creditors[creditorIndex].id,
        toName: creditors[creditorIndex].name,
        amount: settledAmount
      });
    }
    
    creditors[creditorIndex].amount -= settledAmount;
    debtors[debtorIndex].amount -= settledAmount;
    
    if (creditors[creditorIndex].amount < 0.01) creditorIndex++;
    if (debtors[debtorIndex].amount < 0.01) debtorIndex++;
  }
  
  return transactions;
}
