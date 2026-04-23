import { QueryClient } from '@tanstack/react-query';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30 * 1000,
      gcTime: 30 * 60 * 1000,
      refetchOnMount: 'always',
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});
