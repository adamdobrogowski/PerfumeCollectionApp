import { useSearchParams } from 'react-router'
import { parseGenders, resolveId, withFilter, withoutFilters } from './filters.js'
import { useBrands, useFamilies } from './useDictionaries.js'

export function useCatalogFilters() {
  const [searchParams, setSearchParams] = useSearchParams()
  const brands = useBrands()
  const families = useFamilies()

  const filters = {
    gender: parseGenders(searchParams.get('gender')),
    brand: resolveId(searchParams.get('brand'), brands.data),
    family: resolveId(searchParams.get('family'), families.data),
  }
  const hasFilters = filters.gender.length > 0 || filters.brand !== null || filters.family !== null

  function setFilter(name, value) {
    setSearchParams((previous) => withFilter(previous, name, value))
  }

  function clearFilters() {
    setSearchParams((previous) => withoutFilters(previous))
  }

  return { filters, brands, families, hasFilters, setFilter, clearFilters }
}