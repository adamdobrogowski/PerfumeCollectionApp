import { useQuery } from '@tanstack/react-query'
import { fetchAccords, fetchBrands, fetchFamilies, fetchNotes } from '../../api/catalog.js'

function useDictionary(name, queryFn, enabled = true) {
  return useQuery({
    queryKey: ['catalog', name],
    queryFn,
    enabled,
    staleTime: Infinity,
    gcTime: Infinity,
  })
}

export function useBrands() {
  return useDictionary('brands', fetchBrands)
}

export function useAccords(enabled) {
  return useDictionary('accords', fetchAccords, enabled)
}

export function useFamilies() {
  return useDictionary('families', fetchFamilies)
}

export function useNotes(enabled) {
  return useDictionary('notes', fetchNotes, enabled)
}