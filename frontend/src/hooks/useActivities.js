import { useQuery } from '@tanstack/react-query';
import { authFetch } from '../utils/auth';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

// Fetch activities
export function useActivities(limit = 50) {
  return useQuery({
    queryKey: ['activities', limit],
    queryFn: async () => {
      const response = await authFetch(`${API_URL}/api/activity?limit=${limit}`);
      if (!response.ok) throw new Error('Failed to fetch activities');
      return response.json();
    },
    enabled: false, // Only fetch when explicitly requested
  });
}
