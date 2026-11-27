import { useQuery } from '@tanstack/react-query'
import { fetchDiscover } from '../api/discover.js'

export const discoverKey = ['discover']

export function useDiscover() {
  return useQuery({
    queryKey: discoverKey,
    queryFn: fetchDiscover,
    staleTime: 5 * 60 * 1000,
  })
}