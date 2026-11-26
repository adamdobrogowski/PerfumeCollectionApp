import { keepPreviousData, useQuery } from '@tanstack/react-query'
import { searchPerfumes } from '../api/catalog.js'

export const FIRST_PAGE_SIZE = 20
export const EXTENDED_PAGE_SIZE = 50

export function useOnboardingSearch({ phrase, gender, familyId, limit }) {
  const params = { q: phrase, gender, family: familyId, limit }

  return useQuery({
    queryKey: ['catalog', 'perfumes', 'onboarding', params],
    queryFn: () => searchPerfumes(params),
    placeholderData: keepPreviousData,
    staleTime: 5 * 60 * 1000,
  })
}