import { useQuery } from '@tanstack/react-query'
import { fetchShelf } from '../api/shelf.js'

export const shelfListKey = ['shelf', 'list']

export function useShelf() {
  return useQuery({
    queryKey: shelfListKey,
    queryFn: fetchShelf,
    staleTime: 5 * 60 * 1000,
  })
}