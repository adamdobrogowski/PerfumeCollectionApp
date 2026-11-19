import { useQuery } from '@tanstack/react-query'
import { ApiError } from '../api/client.js'
import { fetchShelfEntry } from '../api/shelf.js'

export function shelfEntryKey(perfumeId) {
  return ['shelf', 'entry', perfumeId]
}

export function useShelfEntry(perfumeId) {
  return useQuery({
    queryKey: shelfEntryKey(perfumeId),
    queryFn: () => fetchShelfEntry(perfumeId),
    staleTime: 5 * 60 * 1000,
    retry: (failureCount, error) => {
      const isClientError = error instanceof ApiError && error.status >= 400 && error.status < 500
      return !isClientError && failureCount < 3
    },
  })
}