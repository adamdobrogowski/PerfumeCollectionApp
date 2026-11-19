import { useQuery } from '@tanstack/react-query'
import { ApiError } from '../api/client.js'
import { fetchPerfume } from '../api/catalog.js'

export function usePerfume(id) {
  return useQuery({
    queryKey: ['catalog', 'perfume', id],
    queryFn: () => fetchPerfume(id),
    enabled: id !== null,
    staleTime: 5 * 60 * 1000,
    retry: (failureCount, error) => {
      const isClientError = error instanceof ApiError && error.status >= 400 && error.status < 500
      return !isClientError && failureCount < 3
    },
  })
}