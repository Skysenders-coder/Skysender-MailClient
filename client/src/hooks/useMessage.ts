import { useQuery } from '@tanstack/react-query';
import { api } from '../api/client';

export function useMessage(id: string | null, folder: string) {
  return useQuery({
    queryKey: ['message', folder, id],
    queryFn: () => api.getMessage(id!, folder),
    enabled: !!id,
  });
}
