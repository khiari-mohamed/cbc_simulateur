import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../lib/api/client';

export interface Notification {
  id: string;
  type: string;
  subject: string;
  content: string;
  status: 'PENDING' | 'SENT' | 'FAILED';
  createdAt: string;
}

export const useNotifications = (page = 1, limit = 20, unreadOnly = false) => {
  return useQuery({
    queryKey: ['notifications', page, limit, unreadOnly],
    queryFn: async () => {
      const response = await api.get('/notifications', {
        params: { page, limit, unreadOnly },
      });
      return response.data;
    },
  });
};

export const useUnreadCount = () => {
  return useQuery({
    queryKey: ['notifications', 'unread-count'],
    queryFn: async () => {
      const response = await api.get('/notifications/unread-count');
      return response.data;
    },
    refetchInterval: 30000, // Refetch every 30 seconds
  });
};

export const useMarkAsRead = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (notificationId: string) =>
      api.post(`/notifications/${notificationId}/mark-read`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
  });
};

export const useMarkAllAsRead = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: () => api.post('/notifications/mark-all-read'),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
  });
};