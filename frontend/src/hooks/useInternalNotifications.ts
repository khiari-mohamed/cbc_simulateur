import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../lib/api/client';

export interface InternalNotification {
  id: string;
  type: string;
  subject: string;
  content: string;
  status: 'PENDING' | 'SENT' | 'FAILED';
  createdAt: string;
}

export const useInternalNotifications = (page = 1, limit = 20) => {
  return useQuery({
    queryKey: ['internal-notifications', page, limit],
    queryFn: async () => {
      const response = await api.get('/internal-notifications', {
        params: { page, limit },
      });
      return response.data;
    },
  });
};

export const useUnreadInternalCount = () => {
  return useQuery({
    queryKey: ['internal-notifications', 'unread-count'],
    queryFn: async () => {
      const response = await api.get('/internal-notifications/unread-count');
      return response.data;
    },
    refetchInterval: 30000, // Refetch every 30 seconds
  });
};

export const useCreateUrgentReview = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (data: { quoteNumber: string; reason: string }) =>
      api.post('/internal-notifications/urgent-review', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['internal-notifications'] });
    },
  });
};

export const useCreateSystemAlert = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (data: { message: string; targetRole?: string }) =>
      api.post('/internal-notifications/system-alert', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['internal-notifications'] });
    },
  });
};

export const useMarkInternalAsRead = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (notificationId: string) =>
      api.post(`/internal-notifications/${notificationId}/mark-read`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['internal-notifications'] });
    },
  });
};

export const useMarkAllInternalAsRead = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: () => api.post('/internal-notifications/mark-all-read'),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['internal-notifications'] });
    },
  });
};

export const useDeleteInternalNotification = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (notificationId: string) =>
      api.delete(`/internal-notifications/${notificationId}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['internal-notifications'] });
    },
  });
};

export const useBulkDeleteInternalNotifications = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (ids: string[]) =>
      api.post('/internal-notifications/bulk-delete', { ids }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['internal-notifications'] });
    },
  });
};

export const useBulkMarkInternalAsRead = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (ids: string[]) =>
      Promise.all(ids.map(id => api.post(`/internal-notifications/${id}/mark-read`))),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['internal-notifications'] });
    },
  });
};