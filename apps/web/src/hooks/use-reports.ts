import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';

export function useDashboardStats(projectId: string) {
  return useQuery({
    queryKey: ['dashboard', projectId],
    queryFn: () => apiClient.get(`/reports/dashboard/${projectId}`),
    enabled: !!projectId,
  });
}

export function useProjectHealth(projectId: string) {
  return useQuery({
    queryKey: ['health', projectId],
    queryFn: () => apiClient.get(`/reports/health/${projectId}`),
    enabled: !!projectId,
  });
}

export function useProjectTimeline(projectId: string, startDate?: string, endDate?: string) {
  return useQuery({
    queryKey: ['timeline', projectId, startDate, endDate],
    queryFn: () => apiClient.get(`/reports/timeline/${projectId}`, { params: { startDate, endDate } }),
    enabled: !!projectId,
  });
}

export function useTasksSummary(projectId: string) {
  return useQuery({
    queryKey: ['tasksSummary', projectId],
    queryFn: () => apiClient.get(`/reports/tasks-summary/${projectId}`),
    enabled: !!projectId,
  });
}
