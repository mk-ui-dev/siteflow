import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api-client';

export function useDashboardStats(projectId: string) {
  return useQuery({
    queryKey: ['reports', 'dashboard', projectId],
    queryFn: () => api.reports.dashboard(projectId).then((res) => res.data),
    enabled: !!projectId,
  });
}

export function useTasksSummary(projectId: string) {
  return useQuery({
    queryKey: ['reports', 'tasks-summary', projectId],
    queryFn: () => api.reports.tasksSummary(projectId).then((res) => res.data),
    enabled: !!projectId,
  });
}

export function useProjectHealth(projectId: string) {
  return useQuery({
    queryKey: ['reports', 'health', projectId],
    queryFn: () => api.reports.projectHealth(projectId).then((res) => res.data),
    enabled: !!projectId,
  });
}

export function useTimeline(projectId: string) {
  return useQuery({
    queryKey: ['reports', 'timeline', projectId],
    queryFn: () => api.reports.timeline(projectId).then((res) => res.data),
    enabled: !!projectId,
  });
}
