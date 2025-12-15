import { describe, it, expect } from 'vitest';
import { calculateSettlement, calculateOptimizedSettlements, getGroups } from '../src/services/settlement.js';

describe('Settlement Calculation - New Hierarchical Logic', () => {
  
  describe('Business Rules - Updated for 27 Billable Heads', () => {
    it('should have 9 groups with 21 total people', () => {
      const groups = getGroups();
      expect(groups).toHaveLength(9);
      
      const totalPeople = groups.reduce((sum, g) => sum + g.count, 0);
      expect(totalPeople).toBe(21);
    });

    it('should have Other Family (External) with 3 people', () => {
      const groups = getGroups();
      const otherFamily = groups.find(g => g.type === 'External');
      expect(otherFamily).toBeDefined();
      expect(otherFamily.count).toBe(3);
    });

    it('should have 8 Internal groups with 18 total people', () => {
      const groups = getGroups();
      const internal = groups.filter(g => g.type === 'Internal');
      const totalInternal = internal.reduce((sum, g) => sum + g.count, 0);
      expect(totalInternal).toBe(18);
    });
  });

  describe('New Hierarchical Fair Share Logic', () => {
    it('should calculate base unit cost per billable head as total expense divided by 27', () => {
      const totalExpense = 2700;
      const expenses = [{ paidBy: 1, amount: totalExpense.toString() }];
      const settlement = calculateSettlement(expenses);
      
      const baseUnitCost = totalExpense / 27;
      expect(baseUnitCost).toBe(100);
      
      const otherFamily = settlement.find(s => s.id === 1);
      // Other Family pays baseUnitCost * 3 = 100 * 3 = 300
      expect(otherFamily.fairShare).toBe(300);
    });

    it('External group (Other Family) pays Base Unit Cost × 3', () => {
      const totalExpense = 2700;
      const expenses = [{ paidBy: 2, amount: totalExpense.toString() }];
      
      const settlement = calculateSettlement(expenses);
      const otherFamily = settlement.find(s => s.type === 'External');
      
      const baseUnitCost = totalExpense / 27;
      const expectedFairShare = baseUnitCost * 3;
      
      expect(otherFamily.fairShare).toBe(expectedFairShare);
      expect(otherFamily.fairShare).toBe(300);
    });

    it('Internal groups split remaining cost equally among 18 paying members - group with 3 people', () => {
      const totalExpense = 2700;
      const expenses = [{ paidBy: 1, amount: totalExpense.toString() }];
      
      const settlement = calculateSettlement(expenses);
      const subhojit = settlement.find(s => s.id === 2);
      
      const baseUnitCost = totalExpense / 27;
      const externalFairShare = baseUnitCost * 3; // 300
      const mainFamilyTotal = totalExpense - externalFairShare; // 2400
      const perPayingMember = mainFamilyTotal / 18; // 133.33...
      const expectedFairShare = perPayingMember * 3; // 400
      
      expect(subhojit.count).toBe(3);
      expect(subhojit.fairShare).toBeCloseTo(expectedFairShare, 2);
      expect(subhojit.fairShare).toBeCloseTo(400, 2);
    });

    it('Internal groups split remaining cost equally among 18 paying members - group with 2 people', () => {
      const totalExpense = 2700;
      const expenses = [{ paidBy: 1, amount: totalExpense.toString() }];
      
      const settlement = calculateSettlement(expenses);
      const abhijit = settlement.find(s => s.id === 4);
      
      const baseUnitCost = totalExpense / 27;
      const externalFairShare = baseUnitCost * 3; // 300
      const mainFamilyTotal = totalExpense - externalFairShare; // 2400
      const perPayingMember = mainFamilyTotal / 18; // 133.33...
      const expectedFairShare = perPayingMember * 2; // 266.67...
      
      expect(abhijit.count).toBe(2);
      expect(abhijit.fairShare).toBeCloseTo(expectedFairShare, 2);
      expect(abhijit.fairShare).toBeCloseTo(266.67, 2);
    });

    it('Internal groups with 3 people pay more than groups with 2 people', () => {
      const totalExpense = 2700;
      const expenses = [{ paidBy: 1, amount: totalExpense.toString() }];
      
      const settlement = calculateSettlement(expenses);
      
      const group3People = settlement.find(s => s.id === 2);
      const group2People = settlement.find(s => s.id === 4);
      
      expect(group3People.count).toBe(3);
      expect(group2People.count).toBe(2);
      
      const ratio = group3People.fairShare / group2People.fairShare;
      expect(ratio).toBeCloseTo(1.5, 2);
    });

    it('Sum of all fair shares should equal total expense', () => {
      const totalExpense = 2700;
      const expenses = [{ paidBy: 1, amount: totalExpense.toString() }];
      
      const settlement = calculateSettlement(expenses);
      const totalFairShare = settlement.reduce((sum, s) => sum + s.fairShare, 0);
      
      expect(totalFairShare).toBeCloseTo(totalExpense, 2);
    });
  });

  describe('Balance Calculation with New Logic', () => {
    it('should calculate correct balance when Other Family overpays', () => {
      const expenses = [{ paidBy: 1, amount: '2700' }];
      const settlement = calculateSettlement(expenses);
      const otherFamily = settlement.find(s => s.id === 1);
      
      expect(otherFamily.totalPaid).toBe(2700);
      expect(otherFamily.fairShare).toBe(300);
      expect(otherFamily.balance).toBe(2400);
    });

    it('should calculate correct balance when larger internal group overpays', () => {
      const expenses = [{ paidBy: 2, amount: '2700' }];
      const settlement = calculateSettlement(expenses);
      const subhojit = settlement.find(s => s.id === 2);
      
      expect(subhojit.totalPaid).toBe(2700);
      expect(subhojit.fairShare).toBeCloseTo(400, 2);
      expect(subhojit.balance).toBeCloseTo(2300, 2);
    });

    it('should calculate correct balance when smaller internal group overpays', () => {
      const expenses = [{ paidBy: 4, amount: '2700' }];
      const settlement = calculateSettlement(expenses);
      const abhijit = settlement.find(s => s.id === 4);
      
      expect(abhijit.totalPaid).toBe(2700);
      expect(abhijit.fairShare).toBeCloseTo(266.67, 2);
      expect(abhijit.balance).toBeCloseTo(2433.33, 2);
    });

    it('Sum of all balances should equal zero', () => {
      const expenses = [
        { paidBy: 1, amount: '500' },
        { paidBy: 2, amount: '800' },
        { paidBy: 4, amount: '800' }
      ];
      
      const settlement = calculateSettlement(expenses);
      const totalBalance = settlement.reduce((sum, s) => sum + s.balance, 0);
      
      expect(totalBalance).toBeCloseTo(0, 2);
    });
  });

  describe('Complex Scenarios with New Logic', () => {
    it('should handle realistic multi-payer scenario', () => {
      const expenses = [
        { paidBy: 1, amount: '400' },
        { paidBy: 2, amount: '600' },
        { paidBy: 4, amount: '500' },
        { paidBy: 5, amount: '600' }
      ];
      
      const totalExpense = 2100;
      const settlement = calculateSettlement(expenses);
      const baseUnitCost = totalExpense / 27;
      
      const otherFamily = settlement.find(s => s.id === 1);
      expect(otherFamily.totalPaid).toBe(400);
      expect(otherFamily.fairShare).toBeCloseTo(baseUnitCost * 3, 2);
      expect(otherFamily.balance).toBeCloseTo(400 - (baseUnitCost * 3), 2);
      
      const mainFamilyTotal = totalExpense - (baseUnitCost * 3);
      const perPayingMember = mainFamilyTotal / 18;
      
      const abhijit = settlement.find(s => s.id === 4);
      expect(abhijit.fairShare).toBeCloseTo(perPayingMember * 2, 2);
    });

    it('should verify total paid equals total expense', () => {
      const expenses = [
        { paidBy: 1, amount: '400' },
        { paidBy: 2, amount: '600' },
        { paidBy: 4, amount: '500' },
        { paidBy: 5, amount: '600' }
      ];
      
      const settlement = calculateSettlement(expenses);
      const totalPaid = settlement.reduce((sum, s) => sum + s.totalPaid, 0);
      const totalExpense = expenses.reduce((sum, e) => sum + parseFloat(e.amount), 0);
      
      expect(totalPaid).toBe(totalExpense);
    });
  });

  describe('Optimized Settlements with New Logic', () => {
    it('should create valid transactions', () => {
      const expenses = [{ paidBy: 1, amount: '2700' }];
      const transactions = calculateOptimizedSettlements(expenses);
      
      expect(transactions.length).toBeGreaterThan(0);
      
      transactions.forEach(t => {
        expect(t).toHaveProperty('from');
        expect(t).toHaveProperty('to');
        expect(t).toHaveProperty('amount');
        expect(t.amount).toBeGreaterThan(0);
      });
    });

    it('should settle debts correctly', () => {
      const expenses = [
        { paidBy: 1, amount: '1000' },
        { paidBy: 2, amount: '600' },
        { paidBy: 4, amount: '500' }
      ];
      
      const transactions = calculateOptimizedSettlements(expenses);
      const settlement = calculateSettlement(expenses);
      
      const totalTransactions = transactions.reduce((sum, t) => sum + t.amount, 0);
      const totalCredits = settlement
        .filter(s => s.balance > 0.01)
        .reduce((sum, s) => sum + s.balance, 0);
      
      expect(totalTransactions).toBeCloseTo(totalCredits, 1);
    });
  });

  describe('Edge Cases with New Logic', () => {
    it('should handle zero expenses', () => {
      const expenses = [];
      const settlement = calculateSettlement(expenses);
      
      settlement.forEach(s => {
        expect(s.totalPaid).toBe(0);
        expect(s.fairShare).toBe(0);
        expect(s.balance).toBe(0);
      });
    });

    it('should handle single payer', () => {
      const expenses = [{ paidBy: 5, amount: '2700' }];
      const settlement = calculateSettlement(expenses);
      
      const payer = settlement.find(s => s.id === 5);
      expect(payer.balance).toBeGreaterThan(0);
      
      const nonPayers = settlement.filter(s => s.id !== 5);
      nonPayers.forEach(s => {
        expect(s.balance).toBeLessThan(0);
      });
    });
  });
});
