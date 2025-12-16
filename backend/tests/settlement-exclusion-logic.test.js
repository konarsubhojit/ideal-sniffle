import { describe, it, expect } from 'vitest';
import { calculateSettlement } from '../src/services/settlement.js';

describe('Settlement Calculation - Exclusion Logic', () => {
  
  describe('Groups without members (backward compatibility)', () => {
    it('should use group.count when no members are defined', () => {
      const groups = [
        { id: 1, name: "External Group", count: 3, type: "External", members: [] },
        { id: 2, name: "Internal Group", count: 2, type: "Internal", members: [] }
      ];
      
      const expenses = [{ paidBy: 1, amount: '1000' }];
      const settlement = calculateSettlement(expenses, groups);
      
      // Total billable: 3 external + 2 internal = 5
      // Base cost: 1000 / 5 = 200
      // External pays: 200 * 3 = 600
      // Internal total: 1000 - 600 = 400
      // Internal per member: 400 / 2 = 200
      // Internal pays: 200 * 2 = 400
      
      const external = settlement.find(s => s.id === 1);
      const internal = settlement.find(s => s.id === 2);
      
      expect(external.fairShare).toBe(600);
      expect(internal.fairShare).toBe(400);
    });
  });
  
  describe('Groups with members - Global exclusion', () => {
    it('should exclude globally excluded members from all calculations', () => {
      const groups = [
        { 
          id: 1, 
          name: "External Group", 
          count: 3, 
          type: "External",
          members: [
            { id: 1, name: "Ext Member 1", isPaying: 1, excludeFromAllHeadcount: 0, excludeFromInternalHeadcount: 0 },
            { id: 2, name: "Ext Member 2", isPaying: 1, excludeFromAllHeadcount: 0, excludeFromInternalHeadcount: 0 },
            { id: 3, name: "Ext Member 3 (excluded)", isPaying: 0, excludeFromAllHeadcount: 1, excludeFromInternalHeadcount: 0 }
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
            { id: 6, name: "Int Member 3 (excluded)", isPaying: 0, excludeFromAllHeadcount: 1, excludeFromInternalHeadcount: 0 }
          ]
        }
      ];
      
      const expenses = [{ paidBy: 1, amount: '1000' }];
      const settlement = calculateSettlement(expenses, groups);
      
      // Total members: 6 (including excluded)
      // Total billable: 2 external + 2 internal = 4 (excluding globally excluded)
      // Base cost: 1000 / 4 = 250
      // External billable: 2, so pays 250 * 2 = 500
      // Internal total: 1000 - 500 = 500
      // Internal billable: 2, per member: 500 / 2 = 250
      // Internal pays: 250 * 2 = 500
      
      const external = settlement.find(s => s.id === 1);
      const internal = settlement.find(s => s.id === 2);
      
      expect(external.fairShare).toBe(500);
      expect(internal.fairShare).toBe(500);
      expect(external.balance).toBe(500); // paid 1000, owe 500
      expect(internal.balance).toBe(-500); // paid 0, owe 500
    });
  });
  
  describe('Groups with members - Internal exclusion', () => {
    it('should exclude internally excluded members only from internal group calculations', () => {
      const groups = [
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
            { id: 5, name: "Int Member 3 (internal exclude)", isPaying: 1, excludeFromAllHeadcount: 0, excludeFromInternalHeadcount: 1 }
          ]
        }
      ];
      
      const expenses = [{ paidBy: 1, amount: '1000' }];
      const settlement = calculateSettlement(expenses, groups);
      
      // Total members: 5
      // Total billable (for base cost): 2 external + 3 internal = 5
      // Base cost: 1000 / 5 = 200
      // External billable: 2, pays 200 * 2 = 400
      // Internal total: 1000 - 400 = 600
      // Internal billable (for payment): 2 (excludes internally excluded member)
      // Internal per member: 600 / 2 = 300
      // Internal pays: 300 * 2 = 600
      
      const external = settlement.find(s => s.id === 1);
      const internal = settlement.find(s => s.id === 2);
      
      expect(external.fairShare).toBe(400);
      expect(internal.fairShare).toBe(600);
    });
  });
  
  describe('Groups with members - Mixed exclusions', () => {
    it('should handle both global and internal exclusions correctly', () => {
      const groups = [
        { 
          id: 1, 
          name: "External Group", 
          count: 4, 
          type: "External",
          members: [
            { id: 1, name: "Ext Member 1", isPaying: 1, excludeFromAllHeadcount: 0, excludeFromInternalHeadcount: 0 },
            { id: 2, name: "Ext Member 2", isPaying: 1, excludeFromAllHeadcount: 0, excludeFromInternalHeadcount: 0 },
            { id: 3, name: "Ext Member 3", isPaying: 1, excludeFromAllHeadcount: 0, excludeFromInternalHeadcount: 0 },
            { id: 4, name: "Ext Member 4 (global exclude)", isPaying: 0, excludeFromAllHeadcount: 1, excludeFromInternalHeadcount: 0 }
          ]
        },
        { 
          id: 2, 
          name: "Internal Group 1", 
          count: 4, 
          type: "Internal",
          members: [
            { id: 5, name: "Int1 Member 1", isPaying: 1, excludeFromAllHeadcount: 0, excludeFromInternalHeadcount: 0 },
            { id: 6, name: "Int1 Member 2", isPaying: 1, excludeFromAllHeadcount: 0, excludeFromInternalHeadcount: 0 },
            { id: 7, name: "Int1 Member 3 (global exclude)", isPaying: 0, excludeFromAllHeadcount: 1, excludeFromInternalHeadcount: 0 },
            { id: 8, name: "Int1 Member 4 (internal exclude)", isPaying: 1, excludeFromAllHeadcount: 0, excludeFromInternalHeadcount: 1 }
          ]
        },
        { 
          id: 3, 
          name: "Internal Group 2", 
          count: 3, 
          type: "Internal",
          members: [
            { id: 9, name: "Int2 Member 1", isPaying: 1, excludeFromAllHeadcount: 0, excludeFromInternalHeadcount: 0 },
            { id: 10, name: "Int2 Member 2", isPaying: 1, excludeFromAllHeadcount: 0, excludeFromInternalHeadcount: 0 },
            { id: 11, name: "Int2 Member 3", isPaying: 1, excludeFromAllHeadcount: 0, excludeFromInternalHeadcount: 0 }
          ]
        }
      ];
      
      const expenses = [{ paidBy: 1, amount: '2000' }];
      const settlement = calculateSettlement(expenses, groups);
      
      // Total members: 11
      // External billable (for base cost): 3 (4 - 1 globally excluded)
      // Internal Group 1 billable (for base cost): 3 (4 - 1 globally excluded, internal exclusion doesn't affect base cost)
      // Internal Group 2 billable (for base cost): 3
      // Total billable for base cost: 3 + 3 + 3 = 9
      // Base cost: 2000 / 9 = 222.222...
      // External pays: 222.222... * 3 = 666.666...
      // Internal total: 2000 - 666.666... = 1333.333...
      // Internal Group 1 billable (for payment): 2 (excluding both globally and internally excluded)
      // Internal Group 2 billable (for payment): 3
      // Total internal billable for payment: 2 + 3 = 5
      // Internal per member: 1333.333... / 5 = 266.666...
      // Internal Group 1 pays: 266.666... * 2 = 533.333...
      // Internal Group 2 pays: 266.666... * 3 = 800
      
      const external = settlement.find(s => s.id === 1);
      const internal1 = settlement.find(s => s.id === 2);
      const internal2 = settlement.find(s => s.id === 3);
      
      expect(external.fairShare).toBeCloseTo(666.67, 2);
      expect(internal1.fairShare).toBeCloseTo(533.33, 2);
      expect(internal2.fairShare).toBeCloseTo(800, 2);
      
      // Verify total fair shares equal total expense
      const totalFairShare = settlement.reduce((sum, s) => sum + s.fairShare, 0);
      expect(totalFairShare).toBeCloseTo(2000, 2);
    });
  });
  
  describe('Headcount calculations', () => {
    it('should calculate correct headcount statistics', () => {
      const groups = [
        { 
          id: 1, 
          name: "External Group", 
          count: 3, 
          type: "External",
          members: [
            { id: 1, name: "Ext Member 1", isPaying: 1, excludeFromAllHeadcount: 0, excludeFromInternalHeadcount: 0 },
            { id: 2, name: "Ext Member 2", isPaying: 1, excludeFromAllHeadcount: 0, excludeFromInternalHeadcount: 0 },
            { id: 3, name: "Ext Member 3 (excluded)", isPaying: 0, excludeFromAllHeadcount: 1, excludeFromInternalHeadcount: 0 }
          ]
        },
        { 
          id: 2, 
          name: "Internal Group", 
          count: 4, 
          type: "Internal",
          members: [
            { id: 4, name: "Int Member 1", isPaying: 1, excludeFromAllHeadcount: 0, excludeFromInternalHeadcount: 0 },
            { id: 5, name: "Int Member 2", isPaying: 1, excludeFromAllHeadcount: 0, excludeFromInternalHeadcount: 0 },
            { id: 6, name: "Int Member 3 (global exclude)", isPaying: 0, excludeFromAllHeadcount: 1, excludeFromInternalHeadcount: 0 },
            { id: 7, name: "Int Member 4 (internal exclude)", isPaying: 1, excludeFromAllHeadcount: 0, excludeFromInternalHeadcount: 1 }
          ]
        }
      ];
      
      const expenses = [{ paidBy: 1, amount: '1000' }];
      const settlement = calculateSettlement(expenses, groups);
      
      // Total headcount: 7 members (all members including excluded)
      // Total billable (global): 5 (excluding 2 globally excluded: Ext Member 3, Int Member 3)
      // External billable: 2
      // Internal billable (for calculation): 2 (excluding both globally and internally excluded: Int Member 3, Int Member 4)
      
      const external = settlement.find(s => s.id === 1);
      const internal = settlement.find(s => s.id === 2);
      
      // Verify the calculated counts are stored
      expect(external.calculatedTotalCount).toBe(3);
      expect(external.calculatedBillableCount).toBe(2);
      expect(internal.calculatedTotalCount).toBe(4);
      expect(internal.calculatedBillableCount).toBe(3); // for base cost calculation
      expect(internal.calculatedInternalBillableCount).toBe(2); // for internal payment
    });
  });
  
  describe('Sum of balances should be zero', () => {
    it('should ensure all balances sum to zero with exclusions', () => {
      const groups = [
        { 
          id: 1, 
          name: "External Group", 
          count: 2, 
          type: "External",
          members: [
            { id: 1, name: "Ext Member 1", isPaying: 1, excludeFromAllHeadcount: 0, excludeFromInternalHeadcount: 0 },
            { id: 2, name: "Ext Member 2 (excluded)", isPaying: 0, excludeFromAllHeadcount: 1, excludeFromInternalHeadcount: 0 }
          ]
        },
        { 
          id: 2, 
          name: "Internal Group 1", 
          count: 2, 
          type: "Internal",
          members: [
            { id: 3, name: "Int Member 1", isPaying: 1, excludeFromAllHeadcount: 0, excludeFromInternalHeadcount: 0 },
            { id: 4, name: "Int Member 2", isPaying: 1, excludeFromAllHeadcount: 0, excludeFromInternalHeadcount: 0 }
          ]
        },
        { 
          id: 3, 
          name: "Internal Group 2", 
          count: 2, 
          type: "Internal",
          members: [
            { id: 5, name: "Int Member 3", isPaying: 1, excludeFromAllHeadcount: 0, excludeFromInternalHeadcount: 0 },
            { id: 6, name: "Int Member 4 (internal exclude)", isPaying: 1, excludeFromAllHeadcount: 0, excludeFromInternalHeadcount: 1 }
          ]
        }
      ];
      
      const expenses = [
        { paidBy: 1, amount: '300' },
        { paidBy: 2, amount: '500' },
        { paidBy: 3, amount: '700' }
      ];
      
      const settlement = calculateSettlement(expenses, groups);
      const totalBalance = settlement.reduce((sum, s) => sum + s.balance, 0);
      
      expect(totalBalance).toBeCloseTo(0, 2);
    });
  });
});
