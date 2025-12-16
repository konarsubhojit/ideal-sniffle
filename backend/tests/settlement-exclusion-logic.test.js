import { describe, it, expect } from 'vitest';
import { calculateSettlement } from '../src/services/settlement.js';

describe('Settlement Calculation - Exclusion Logic (New Approach)', () => {
  
  describe('Groups without excluded members', () => {
    it('should use group.count when no members are excluded', () => {
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
  
  describe('Groups with globally excluded members', () => {
    it('should exclude globally excluded members from all calculations', () => {
      const groups = [
        { 
          id: 1, 
          name: "External Group", 
          count: 3, // Total 3 members
          type: "External",
          members: [
            // Only store the 1 excluded member
            { id: 3, name: "Excluded", excludeFromAllHeadcount: 1, excludeFromInternalHeadcount: 0 }
          ]
        },
        { 
          id: 2, 
          name: "Internal Group", 
          count: 3, // Total 3 members
          type: "Internal",
          members: [
            // Only store the 1 excluded member
            { id: 6, name: "Excluded", excludeFromAllHeadcount: 1, excludeFromInternalHeadcount: 0 }
          ]
        }
      ];
      
      const expenses = [{ paidBy: 1, amount: '1000' }];
      const settlement = calculateSettlement(expenses, groups);
      
      // Total members: 6 (3 + 3)
      // Total billable: 4 (3-1 external + 3-1 internal)
      // Base cost: 1000 / 4 = 250
      // External billable: 2, pays: 250 * 2 = 500
      // Internal total: 1000 - 500 = 500
      // Internal billable: 2, per member: 500 / 2 = 250
      // Internal pays: 250 * 2 = 500
      
      const external = settlement.find(s => s.id === 1);
      const internal = settlement.find(s => s.id === 2);
      
      expect(external.fairShare).toBe(500);
      expect(internal.fairShare).toBe(500);
    });
  });
  
  describe('Groups with internally excluded members', () => {
    it('should exclude internally excluded members only from internal payment', () => {
      const groups = [
        { 
          id: 1, 
          name: "External Group", 
          count: 2, // Total 2 members
          type: "External",
          members: [] // No exclusions
        },
        { 
          id: 2, 
          name: "Internal Group", 
          count: 3, // Total 3 members
          type: "Internal",
          members: [
            // Only store the 1 internally excluded member
            { id: 5, name: "Internal Excluded", excludeFromAllHeadcount: 0, excludeFromInternalHeadcount: 1 }
          ]
        }
      ];
      
      const expenses = [{ paidBy: 1, amount: '1000' }];
      const settlement = calculateSettlement(expenses, groups);
      
      // Total members: 5 (2 + 3)
      // Total billable (for base cost): 5 (internal exclusion doesn't affect base cost)
      // Base cost: 1000 / 5 = 200
      // External billable: 2, pays: 200 * 2 = 400
      // Internal total: 1000 - 400 = 600
      // Internal billable (for payment): 2 (3 - 1 internally excluded)
      // Internal per member: 600 / 2 = 300
      // Internal pays: 300 * 2 = 600
      
      const external = settlement.find(s => s.id === 1);
      const internal = settlement.find(s => s.id === 2);
      
      expect(external.fairShare).toBe(400);
      expect(internal.fairShare).toBe(600);
    });
  });
  
  describe('Mixed exclusions', () => {
    it('should handle both global and internal exclusions correctly', () => {
      const groups = [
        { 
          id: 1, 
          name: "External Group", 
          count: 4, // Total 4 members
          type: "External",
          members: [
            // 1 globally excluded
            { id: 4, name: "Global Excluded", excludeFromAllHeadcount: 1, excludeFromInternalHeadcount: 0 }
          ]
        },
        { 
          id: 2, 
          name: "Internal Group 1", 
          count: 4, // Total 4 members
          type: "Internal",
          members: [
            // 1 globally excluded, 1 internally excluded
            { id: 7, name: "Global Excluded", excludeFromAllHeadcount: 1, excludeFromInternalHeadcount: 0 },
            { id: 8, name: "Internal Excluded", excludeFromAllHeadcount: 0, excludeFromInternalHeadcount: 1 }
          ]
        },
        { 
          id: 3, 
          name: "Internal Group 2", 
          count: 3, // Total 3 members
          type: "Internal",
          members: [] // No exclusions
        }
      ];
      
      const expenses = [{ paidBy: 1, amount: '2000' }];
      const settlement = calculateSettlement(expenses, groups);
      
      // Total members: 11 (4 + 4 + 3)
      // External billable (for base): 3 (4 - 1 global)
      // Internal Group 1 billable (for base): 3 (4 - 1 global, internal doesn't count here)
      // Internal Group 2 billable (for base): 3
      // Total billable for base: 3 + 3 + 3 = 9
      // Base cost: 2000 / 9 = 222.22...
      // External pays: 222.22 * 3 = 666.67
      // Internal total: 2000 - 666.67 = 1333.33
      // Internal Group 1 billable (for payment): 2 (4 - 1 global - 1 internal)
      // Internal Group 2 billable (for payment): 3
      // Total internal billable for payment: 2 + 3 = 5
      // Internal per member: 1333.33 / 5 = 266.67
      // Internal Group 1 pays: 266.67 * 2 = 533.33
      // Internal Group 2 pays: 266.67 * 3 = 800
      
      const external = settlement.find(s => s.id === 1);
      const internal1 = settlement.find(s => s.id === 2);
      const internal2 = settlement.find(s => s.id === 3);
      
      expect(external.fairShare).toBeCloseTo(666.67, 2);
      expect(internal1.fairShare).toBeCloseTo(533.33, 2);
      expect(internal2.fairShare).toBeCloseTo(800, 2);
      
      // Verify total
      const totalFairShare = settlement.reduce((sum, s) => sum + s.fairShare, 0);
      expect(totalFairShare).toBeCloseTo(2000, 2);
    });
  });
  
  describe('Balance verification', () => {
    it('should ensure all balances sum to zero', () => {
      const groups = [
        { 
          id: 1, 
          name: "External Group", 
          count: 2,
          type: "External",
          members: [
            { id: 2, name: "Excluded", excludeFromAllHeadcount: 1, excludeFromInternalHeadcount: 0 }
          ]
        },
        { 
          id: 2, 
          name: "Internal Group 1", 
          count: 2,
          type: "Internal",
          members: []
        },
        { 
          id: 3, 
          name: "Internal Group 2", 
          count: 2,
          type: "Internal",
          members: [
            { id: 6, name: "Internal Excluded", excludeFromAllHeadcount: 0, excludeFromInternalHeadcount: 1 }
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
