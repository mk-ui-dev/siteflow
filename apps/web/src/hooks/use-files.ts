import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api-client';

export function useFiles(projectId: string) {
  return useQuery({
    queryKey: ['files', projectId],
    queryFn: () => api.files.list(projectId).then((res) => res.data),
    enabled: !!projectId,
  });
}

export function useUploadFile() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (formData: FormData) => api.files.upload(formData).then((res) => res.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['files'] });
    },
  });
}

export function useDeleteFile() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => api.files.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['files'] });
    },
  });
}

export function useGetDownloadUrl(id: string) {
  return useQuery({
    queryKey: ['files', 'download', id],
    queryFn: () => api.files.getDownloadUrl(id).then((res) => res.data),
    enabled: false, // Manual trigger
  });
}
