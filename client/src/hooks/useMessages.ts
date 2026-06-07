import { useQuery } from '@tanstack/react-query';
import { api } from '../api/client';

export function useMessages(folder: string, page: number) {
  return useQuery({
    queryKey: ['messages', folder, page],
    queryFn: () => api.getMessages(folder, page),
  });
}
