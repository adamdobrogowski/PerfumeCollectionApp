import { useQuery } from '@tanstack/react-query'
import { fetchDiscover } from '../api/discover.js'

export const discoverKey = ['discover']

const DISCOVER_STALE_TIME = 5 * 60 * 1000

export function useDiscover() {
  return useQuery({
    queryKey: discoverKey,
    queryFn: fetchDiscover,
    staleTime: DISCOVER_STALE_TIME,
  })
}

export function prefetchDiscover(queryClient) {
  return queryClient.prefetchQuery({
    queryKey: discoverKey,
    queryFn: fetchDiscover,
    staleTime: DISCOVER_STALE_TIME,
  })
}