import { keepPreviousData, useQuery } from '@tanstack/react-query'
import { searchPerfumes } from '../api/catalog.js'

export const PAGE_SIZE = 20

export const MAX_PAGE = Math.floor(100000 / PAGE_SIZE)

export function usePerfumeSearch({ page, phrase, filters, sort }) {
  const params = { q: phrase, ...filters, sort, limit: PAGE_SIZE, offset: (page - 1) * PAGE_SIZE }
  return useQuery({
    queryKey: ['catalog', 'perfumes', params],
    queryFn: () => searchPerfumes(params),
    placeholderData: keepPreviousData,
    staleTime: 5 * 60 * 1000,
  })
}