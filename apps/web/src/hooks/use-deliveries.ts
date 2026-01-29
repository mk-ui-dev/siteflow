import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api-client';

export function useDeliveries(projectId: string, filters?: any) {
  return useQuery({
    queryKey: ['deliveries', projectId, filters],
    queryFn: () => api.deliveries.list(projectId, filters).then((res) => res.data),
    enabled: !!projectId,
  });
}

export function useDelivery(id: string) {
  return useQuery({
    queryKey: ['deliveries', id],
    queryFn: () => api.deliveries.get(id).then((res) => res.data),
    enabled: !!id,
  });
}

export function useCreateDelivery() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: any) => api.deliveries.create(data).then((res) => res.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['deliveries'] });
    },
  });
}

export function useConfirmDelivery() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => api.deliveries.confirm(id).then((res) => res.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['deliveries'] });
    },
  });
}
