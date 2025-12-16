import { useQuery, useMutation, useQueryClient, useInfiniteQuery } from '@tanstack/react-query';
import { authFetch } from '../utils/auth';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

// Fetch expenses with pagination
export function useInfiniteExpenses(perPage = 20) {
  return useInfiniteQuery({
    queryKey: ['expenses'],
    queryFn: async ({ pageParam = 1 }) => {
      const response = await authFetch(`${API_URL}/api/expenses?page=${pageParam}&limit=${perPage}`);
      if (!response.ok) throw new Error('Failed to fetch expenses');
      const data = await response.json();
      
      // Normalize data
      const normalizedData = Array.isArray(data) ? data : data.expenses || [];
      const hasMore = Array.isArray(data) ? data.length === perPage : data.hasMore || false;
      
      return {
        expenses: normalizedData.map(exp => ({
          ...exp,
          amount: parseFloat(exp.amount) || 0
        })),
        nextPage: hasMore ? pageParam + 1 : undefined,
      };
    },
    getNextPageParam: (lastPage) => lastPage.nextPage,
    initialPageParam: 1,
  });
}

// Fetch all expenses (for backward compatibility)
export function useExpenses() {
  return useQuery({
    queryKey: ['expenses'],
    queryFn: async () => {
      const response = await authFetch(`${API_URL}/api/expenses`);
      if (!response.ok) throw new Error('Failed to fetch expenses');
      const data = await response.json();
      
      // Normalize data to always return an array
      let normalizedData = [];
      if (Array.isArray(data)) {
        normalizedData = data;
      } else if (Array.isArray(data?.expenses)) {
        normalizedData = data.expenses;
      }
      
      return normalizedData.map(exp => ({
        ...exp,
        amount: parseFloat(exp.amount) || 0
      }));
    },
  });
}

// Fetch groups
export function useGroups() {
  return useQuery({
    queryKey: ['groups'],
    queryFn: async () => {
      const response = await authFetch(`${API_URL}/api/groups`);
      if (!response.ok) throw new Error('Failed to fetch groups');
      return response.json();
    },
  });
}

// Fetch single group with members
export function useGroup(groupId) {
  return useQuery({
    queryKey: ['groups', groupId],
    queryFn: async () => {
      const response = await authFetch(`${API_URL}/api/groups/${groupId}`);
      if (!response.ok) throw new Error('Failed to fetch group');
      return response.json();
    },
    enabled: !!groupId,
  });
}

// Add expense mutation
export function useAddExpense() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (expenseData) => {
      const response = await authFetch(`${API_URL}/api/expenses`, {
        method: 'POST',
        body: JSON.stringify(expenseData),
      });
      if (!response.ok) throw new Error('Failed to add expense');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['expenses'] });
      queryClient.invalidateQueries({ queryKey: ['settlement'] });
      queryClient.invalidateQueries({ queryKey: ['optimizedSettlements'] });
    },
  });
}

// Update expense mutation
export function useUpdateExpense() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, ...expenseData }) => {
      const response = await authFetch(`${API_URL}/api/expenses/${id}`, {
        method: 'PUT',
        body: JSON.stringify(expenseData),
      });
      if (!response.ok) throw new Error('Failed to update expense');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['expenses'] });
      queryClient.invalidateQueries({ queryKey: ['settlement'] });
      queryClient.invalidateQueries({ queryKey: ['optimizedSettlements'] });
    },
  });
}

// Delete expense mutation
export function useDeleteExpense() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (id) => {
      const response = await authFetch(`${API_URL}/api/expenses/${id}`, {
        method: 'DELETE',
      });
      if (!response.ok) throw new Error('Failed to delete expense');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['expenses'] });
      queryClient.invalidateQueries({ queryKey: ['settlement'] });
      queryClient.invalidateQueries({ queryKey: ['optimizedSettlements'] });
    },
  });
}

// Groups mutations
export function useAddGroup() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (groupData) => {
      const response = await authFetch(`${API_URL}/api/groups`, {
        method: 'POST',
        body: JSON.stringify(groupData),
      });
      if (!response.ok) throw new Error('Failed to add group');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['groups'] });
    },
  });
}

export function useUpdateGroup() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, ...groupData }) => {
      const response = await authFetch(`${API_URL}/api/groups/${id}`, {
        method: 'PUT',
        body: JSON.stringify(groupData),
      });
      if (!response.ok) throw new Error('Failed to update group');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['groups'] });
    },
  });
}

export function useDeleteGroup() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (id) => {
      const response = await authFetch(`${API_URL}/api/groups/${id}`, {
        method: 'DELETE',
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to delete group');
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['groups'] });
    },
  });
}

// Group member mutations
export function useAddGroupMember() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ groupId, ...memberData }) => {
      const response = await authFetch(`${API_URL}/api/groups/${groupId}/members`, {
        method: 'POST',
        body: JSON.stringify(memberData),
      });
      if (!response.ok) throw new Error('Failed to add member');
      return response.json();
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['groups'] });
      queryClient.invalidateQueries({ queryKey: ['groups', variables.groupId] });
    },
  });
}

export function useUpdateGroupMember() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ groupId, memberId, ...memberData }) => {
      const response = await authFetch(`${API_URL}/api/groups/${groupId}/members/${memberId}`, {
        method: 'PUT',
        body: JSON.stringify(memberData),
      });
      if (!response.ok) throw new Error('Failed to update member');
      return response.json();
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['groups'] });
      queryClient.invalidateQueries({ queryKey: ['groups', variables.groupId] });
    },
  });
}

export function useDeleteGroupMember() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ groupId, memberId }) => {
      const response = await authFetch(`${API_URL}/api/groups/${groupId}/members/${memberId}`, {
        method: 'DELETE',
      });
      if (!response.ok) throw new Error('Failed to delete member');
      return response.json();
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['groups'] });
      queryClient.invalidateQueries({ queryKey: ['groups', variables.groupId] });
    },
  });
}
