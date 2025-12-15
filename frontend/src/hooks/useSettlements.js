import { useQuery } from '@tanstack/react-query';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

// Fetch settlement data
export function useSettlement() {
  return useQuery({
    queryKey: ['settlement'],
    queryFn: async () => {
      const response = await fetch(`${API_URL}/api/settlement`);
      if (!response.ok) throw new Error('Failed to fetch settlement');
      return response.json();
    },
  });
}

// Fetch optimized settlements
export function useOptimizedSettlements() {
  return useQuery({
    queryKey: ['optimizedSettlements'],
    queryFn: async () => {
      const response = await fetch(`${API_URL}/api/settlement/optimized`);
      if (!response.ok) throw new Error('Failed to fetch optimized settlements');
      return response.json();
    },
  });
}
