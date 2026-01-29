import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api-client';

export function useDecisions(projectId: string, filters?: any) {
  return useQuery({
    queryKey: ['decisions', projectId, filters],
    queryFn: () => api.decisions.list(projectId, filters).then((res) => res.data),
    enabled: !!projectId,
  });
}

export function useDecision(id: string) {
  return useQuery({
    queryKey: ['decisions', id],
    queryFn: () => api.decisions.get(id).then((res) => res.data),
    enabled: !!id,
  });
}

export function useCreateDecision() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: any) => api.decisions.create(data).then((res) => res.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['decisions'] });
    },
  });
}

export function useApproveDecision() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => api.decisions.approve(id).then((res) => res.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['decisions'] });
    },
  });
}

export function useRejectDecision() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, reason }: { id: string; reason?: string }) =>
      api.decisions.reject(id, reason).then((res) => res.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['decisions'] });
    },
  });
}
