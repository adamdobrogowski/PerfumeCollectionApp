import { useQuery } from '@tanstack/react-query'
import { ApiError } from '../api/client.js'
import { fetchBlindBuyCheck } from '../api/blindBuy.js'

export function blindBuyKey(perfumeId) {
  return ['blindBuy', perfumeId]
}

export function useBlindBuyCheck(perfumeId) {
  return useQuery({
    queryKey: blindBuyKey(perfumeId),
    queryFn: () => fetchBlindBuyCheck(perfumeId),
    gcTime: 0,
    retry: (failureCount, error) => {
      const isClientError = error instanceof ApiError && error.status >= 400 && error.status < 500
      return !isClientError && failureCount < 1
    },
  })
}