#!/usr/bin/env node

/**
 * Manual test script to verify exclusion logic
 * Run with: node backend/tests/manual-test-exclusion.js
 */

import { calculateSettlement } from '../src/services/settlement.js';

console.log('=== Testing Exclusion Logic ===\n');

// Test case 1: No exclusions
console.log('Test 1: No exclusions');
const groups1 = [
  { 
    id: 1, 
    name: "External Group", 
    count: 3, 
    type: "External",
    members: [
      { id: 1, name: "Ext Member 1", isPaying: 1, excludeFromAllHeadcount: 0, excludeFromInternalHeadcount: 0 },
      { id: 2, name: "Ext Member 2", isPaying: 1, excludeFromAllHeadcount: 0, excludeFromInternalHeadcount: 0 },
      { id: 3, name: "Ext Member 3", isPaying: 1, excludeFromAllHeadcount: 0, excludeFromInternalHeadcount: 0 }
    ]
  },
  { 
    id: 2, 
    name: "Internal Group", 
    count: 2, 
    type: "Internal",
    members: [
      { id: 4, name: "Int Member 1", isPaying: 1, excludeFromAllHeadcount: 0, excludeFromInternalHeadcount: 0 },
      { id: 5, name: "Int Member 2", isPaying: 1, excludeFromAllHeadcount: 0, excludeFromInternalHeadcount: 0 }
    ]
  }
];

const expenses1 = [{ paidBy: 1, amount: '1000' }];
const settlement1 = calculateSettlement(expenses1, groups1);

console.log('Total Members: 5 (3 external + 2 internal)');
console.log('Total Billable: 5');
console.log('Base Cost: 1000 / 5 = 200');
console.log('External pays: 200 * 3 = 600');
console.log('Internal total: 1000 - 600 = 400');
console.log('Internal per member: 400 / 2 = 200');
console.log('Internal pays: 200 * 2 = 400\n');
console.log('Results:');
settlement1.forEach(s => {
  console.log(`  ${s.name}: paid=${s.totalPaid}, owes=${s.fairShare.toFixed(2)}, balance=${s.balance.toFixed(2)}`);
});
console.log('\n---\n');

// Test case 2: Global exclusion
console.log('Test 2: Global exclusion (1 external member excluded)');
const groups2 = [
  { 
    id: 1, 
    name: "External Group", 
    count: 3, 
    type: "External",
    members: [
      { id: 1, name: "Ext Member 1", isPaying: 1, excludeFromAllHeadcount: 0, excludeFromInternalHeadcount: 0 },
      { id: 2, name: "Ext Member 2", isPaying: 1, excludeFromAllHeadcount: 0, excludeFromInternalHeadcount: 0 },
      { id: 3, name: "Ext Member 3 (EXCLUDED)", isPaying: 0, excludeFromAllHeadcount: 1, excludeFromInternalHeadcount: 0 }
    ]
  },
  { 
    id: 2, 
    name: "Internal Group", 
    count: 2, 
    type: "Internal",
    members: [
      { id: 4, name: "Int Member 1", isPaying: 1, excludeFromAllHeadcount: 0, excludeFromInternalHeadcount: 0 },
      { id: 5, name: "Int Member 2", isPaying: 1, excludeFromAllHeadcount: 0, excludeFromInternalHeadcount: 0 }
    ]
  }
];

const expenses2 = [{ paidBy: 1, amount: '1000' }];
const settlement2 = calculateSettlement(expenses2, groups2);

console.log('Total Members: 5 (3 external + 2 internal)');
console.log('Total Billable: 4 (2 external + 2 internal, excluding 1 globally excluded)');
console.log('Base Cost: 1000 / 4 = 250');
console.log('External pays: 250 * 2 = 500 (only 2 billable members)');
console.log('Internal total: 1000 - 500 = 500');
console.log('Internal per member: 500 / 2 = 250');
console.log('Internal pays: 250 * 2 = 500\n');
console.log('Results:');
settlement2.forEach(s => {
  console.log(`  ${s.name}: paid=${s.totalPaid}, owes=${s.fairShare.toFixed(2)}, balance=${s.balance.toFixed(2)}`);
});
console.log('\n---\n');

// Test case 3: Internal exclusion
console.log('Test 3: Internal exclusion (1 internal member excluded from internal calculations only)');
const groups3 = [
  { 
    id: 1, 
    name: "External Group", 
    count: 2, 
    type: "External",
    members: [
      { id: 1, name: "Ext Member 1", isPaying: 1, excludeFromAllHeadcount: 0, excludeFromInternalHeadcount: 0 },
      { id: 2, name: "Ext Member 2", isPaying: 1, excludeFromAllHeadcount: 0, excludeFromInternalHeadcount: 0 }
    ]
  },
  { 
    id: 2, 
    name: "Internal Group", 
    count: 3, 
    type: "Internal",
    members: [
      { id: 3, name: "Int Member 1", isPaying: 1, excludeFromAllHeadcount: 0, excludeFromInternalHeadcount: 0 },
      { id: 4, name: "Int Member 2", isPaying: 1, excludeFromAllHeadcount: 0, excludeFromInternalHeadcount: 0 },
      { id: 5, name: "Int Member 3 (INTERNAL EXCLUDE)", isPaying: 1, excludeFromAllHeadcount: 0, excludeFromInternalHeadcount: 1 }
    ]
  }
];

const expenses3 = [{ paidBy: 1, amount: '1000' }];
const settlement3 = calculateSettlement(expenses3, groups3);

console.log('Total Members: 5 (2 external + 3 internal)');
console.log('Total Billable (for base cost): 5 (all members, internal exclusion doesn\'t affect base cost)');
console.log('Base Cost: 1000 / 5 = 200');
console.log('External pays: 200 * 2 = 400');
console.log('Internal total: 1000 - 400 = 600');
console.log('Internal billable (for payment): 2 (excluding internally excluded member)');
console.log('Internal per member: 600 / 2 = 300');
console.log('Internal pays: 300 * 2 = 600\n');
console.log('Results:');
settlement3.forEach(s => {
  console.log(`  ${s.name}: paid=${s.totalPaid}, owes=${s.fairShare.toFixed(2)}, balance=${s.balance.toFixed(2)}`);
});
console.log('\n---\n');

// Test case 4: Mixed exclusions
console.log('Test 4: Mixed exclusions (1 globally excluded, 1 internally excluded)');
const groups4 = [
  { 
    id: 1, 
    name: "External Group", 
    count: 3, 
    type: "External",
    members: [
      { id: 1, name: "Ext Member 1", isPaying: 1, excludeFromAllHeadcount: 0, excludeFromInternalHeadcount: 0 },
      { id: 2, name: "Ext Member 2", isPaying: 1, excludeFromAllHeadcount: 0, excludeFromInternalHeadcount: 0 },
      { id: 3, name: "Ext Member 3 (GLOBAL EXCLUDE)", isPaying: 0, excludeFromAllHeadcount: 1, excludeFromInternalHeadcount: 0 }
    ]
  },
  { 
    id: 2, 
    name: "Internal Group", 
    count: 3, 
    type: "Internal",
    members: [
      { id: 4, name: "Int Member 1", isPaying: 1, excludeFromAllHeadcount: 0, excludeFromInternalHeadcount: 0 },
      { id: 5, name: "Int Member 2", isPaying: 1, excludeFromAllHeadcount: 0, excludeFromInternalHeadcount: 0 },
      { id: 6, name: "Int Member 3 (INTERNAL EXCLUDE)", isPaying: 1, excludeFromAllHeadcount: 0, excludeFromInternalHeadcount: 1 }
    ]
  }
];

const expenses4 = [{ paidBy: 1, amount: '1000' }];
const settlement4 = calculateSettlement(expenses4, groups4);

console.log('Total Members: 6 (3 external + 3 internal)');
console.log('Total Billable (for base cost): 5 (2 external + 3 internal, excluding 1 globally excluded)');
console.log('Base Cost: 1000 / 5 = 200');
console.log('External billable: 2, pays: 200 * 2 = 400');
console.log('Internal total: 1000 - 400 = 600');
console.log('Internal billable (for payment): 2 (excluding internally excluded member)');
console.log('Internal per member: 600 / 2 = 300');
console.log('Internal pays: 300 * 2 = 600\n');
console.log('Results:');
settlement4.forEach(s => {
  console.log(`  ${s.name}: paid=${s.totalPaid}, owes=${s.fairShare.toFixed(2)}, balance=${s.balance.toFixed(2)}`);
});

console.log('\n=== All Manual Tests Complete ===');
