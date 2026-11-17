import { useQuery } from '@tanstack/react-query'
import { fetchAccords, fetchBrands, fetchFamilies, fetchNotes } from '../api/catalog.js'

function useDictionary(name, queryFn) {
  return useQuery({
    queryKey: ['catalog', name],
    queryFn,
    staleTime: Infinity,
    gcTime: Infinity,
  })
}

export function useBrands() {
  return useDictionary('brands', fetchBrands)
}

export function useAccords() {
  return useDictionary('accords', fetchAccords)
}

export function useFamilies() {
  return useDictionary('families', fetchFamilies)
}

export function useNotes() {
  return useDictionary('notes', fetchNotes)
}