import { useQuery } from '@tanstack/react-query'
import { ApiError } from '../api/client.js'
import { fetchNote } from '../api/notes.js'

export function noteKey(perfumeId) {
  return ['notes', 'entry', perfumeId]
}

export function useNote(perfumeId) {
  return useQuery({
    queryKey: noteKey(perfumeId),
    queryFn: () => fetchNote(perfumeId),
    staleTime: 5 * 60 * 1000,
    retry: (failureCount, error) => {
      const isClientError = error instanceof ApiError && error.status >= 400 && error.status < 500
      return !isClientError && failureCount < 3
    },
  })
}