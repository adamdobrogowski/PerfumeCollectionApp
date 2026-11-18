import { useSearchParams } from 'react-router'
import { parseGender, resolveId, withFilter, withoutFilters } from './filters.js'
import { useBrands, useFamilies } from './useDictionaries.js'

export function useCatalogFilters() {
  const [searchParams, setSearchParams] = useSearchParams()
  const brands = useBrands()
  const families = useFamilies()

  const filters = {
    gender: parseGender(searchParams.get('gender')),
    brand: resolveId(searchParams.get('brand'), brands.data),
    family: resolveId(searchParams.get('family'), families.data),
  }
  const hasFilters = Object.values(filters).some((value) => value !== null)

  function setFilter(name, value) {
    setSearchParams((previous) => withFilter(previous, name, value))
  }

  function clearFilters() {
    setSearchParams((previous) => withoutFilters(previous))
  }

  return { filters, brands, families, hasFilters, setFilter, clearFilters }
}