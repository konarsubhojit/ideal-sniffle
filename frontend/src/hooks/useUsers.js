import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { authFetch } from '../utils/auth';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

// Fetch all users (admin only)
export function useUsers() {
  return useQuery({
    queryKey: ['users'],
    queryFn: async () => {
      const response = await authFetch(`${API_URL}/api/users`);
      if (!response.ok) throw new Error('Failed to fetch users');
      return response.json();
    },
  });
}

// Fetch user statistics (admin only)
export function useUserStats() {
  return useQuery({
    queryKey: ['userStats'],
    queryFn: async () => {
      const response = await authFetch(`${API_URL}/api/users/stats`);
      if (!response.ok) throw new Error('Failed to fetch user statistics');
      return response.json();
    },
  });
}

// Update user role (admin only)
export function useUpdateUserRole() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ userId, role }) => {
      const response = await authFetch(`${API_URL}/api/users/${userId}/role`, {
        method: 'PUT',
        body: JSON.stringify({ role }),
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to update user role');
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      queryClient.invalidateQueries({ queryKey: ['userStats'] });
    },
  });
}
