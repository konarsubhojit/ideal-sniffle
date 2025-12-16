import { neon } from '@neondatabase/serverless';

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

function getSql() {
  return neon(process.env.DATABASE_URL);
}

// Fetch groups from database with member exclusion info
export async function getGroupsFromDb() {
  try {
    const sql = getSql();
    const groups = await sql`
      SELECT id, name, count, type
      FROM groups
      ORDER BY id
    `;
    
    // Fetch members for each group to calculate actual billable counts
    for (const group of groups) {
      const members = await sql`
        SELECT 
          id, 
          name, 
          is_paying as "isPaying",
          exclude_from_all_headcount as "excludeFromAllHeadcount",
          exclude_from_internal_headcount as "excludeFromInternalHeadcount"
        FROM group_members
        WHERE group_id = ${group.id}
      `;
      
      group.members = members;
      
      // Calculate billable counts based on exclusion flags
      // If there are no members defined, use the group count
      if (members.length === 0) {
        group.billableCount = group.count;
        group.internalBillableCount = group.count;
      } else {
        // Count members not excluded from all headcount
        group.billableCount = members.filter(m => !m.excludeFromAllHeadcount).length;
        
        // For internal groups, count members not excluded from internal headcount
        if (group.type === 'Internal') {
          group.internalBillableCount = members.filter(
            m => !m.excludeFromAllHeadcount && !m.excludeFromInternalHeadcount
          ).length;
        } else {
          group.internalBillableCount = group.billableCount;
        }
      }
    }
    
    return groups;
  } catch (error) {
    console.error('Error fetching groups from database, using hardcoded fallback', error);
    return GROUPS.map(g => ({
      ...g,
      billableCount: g.count,
      internalBillableCount: g.count,
      members: []
    }));
  }
}

// Legacy function for backward compatibility
export function getGroups() {
  return GROUPS;
}

export function calculateSettlement(expenses, groups = GROUPS) {
  const totalExpense = expenses.reduce((sum, exp) => sum + parseFloat(exp.amount), 0);
  
  // Calculate total billable heads and paying members dynamically
  const externalGroups = groups.filter(g => g.type === 'External');
  const internalGroups = groups.filter(g => g.type === 'Internal');
  
  // Use billableCount if available (from database with member exclusions), otherwise use count
  const externalHeadCount = externalGroups.reduce((sum, g) => sum + (g.billableCount !== undefined ? g.billableCount : g.count), 0);
  const internalPayingCount = internalGroups.reduce((sum, g) => sum + (g.internalBillableCount !== undefined ? g.internalBillableCount : g.count), 0);
  const totalBillableHeads = externalHeadCount + internalPayingCount;
  
  if (totalBillableHeads === 0) {
    return groups.map(group => ({
      ...group,
      totalPaid: 0,
      fairShare: 0,
      balance: 0
    }));
  }
  
  // Base unit cost per billable head
  const baseUnitCost = totalExpense / totalBillableHeads;
  
  // External groups pay for their members
  const externalFairShare = baseUnitCost * externalHeadCount;
  
  // Remaining expense for Main Family (Internal groups)
  const mainFamilyTotalCost = totalExpense - externalFairShare;
  
  // Main Family fair share per paying member
  const mainFamilyPerPayingMember = internalPayingCount > 0 ? mainFamilyTotalCost / internalPayingCount : 0;
  
  return groups.map(group => {
    const totalPaid = expenses
      .filter(exp => exp.paidBy === group.id)
      .reduce((sum, exp) => sum + parseFloat(exp.amount), 0);
    
    let fairShare;
    if (group.type === 'External') {
      // External group pays based on their billable headcount
      const groupBillableCount = group.billableCount !== undefined ? group.billableCount : group.count;
      fairShare = baseUnitCost * groupBillableCount;
    } else {
      // Internal groups: each paying member pays their share
      // Use internalBillableCount for internal groups
      const groupInternalCount = group.internalBillableCount !== undefined ? group.internalBillableCount : group.count;
      fairShare = mainFamilyPerPayingMember * groupInternalCount;
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

export function calculateOptimizedSettlements(expenses, groups = GROUPS) {
  const settlement = calculateSettlement(expenses, groups);
  
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
