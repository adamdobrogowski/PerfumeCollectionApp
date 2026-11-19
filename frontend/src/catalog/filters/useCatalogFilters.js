import { useState } from 'react'
import { useSearchParams } from 'react-router'
import {
  LIST_FILTER_KEYS,
  parseGenders,
  parseIdList,
  resolveId,
  withFilter,
  withIdList,
  withoutFilters,
} from './filters.js'
import { useAccords, useBrands, useFamilies, useNotes } from './useDictionaries.js'

export function useCatalogFilters() {
  const [searchParams, setSearchParams] = useSearchParams()
  const brands = useBrands()
  const families = useFamilies()

  const hasListParams = LIST_FILTER_KEYS.some((key) => searchParams.has(key))
  const [listsOpen, setListsOpen] = useState(hasListParams)
  const needsListDictionaries = listsOpen || hasListParams
  const notes = useNotes(needsListDictionaries)
  const accords = useAccords(needsListDictionaries)

  const requiredNotes = parseIdList(searchParams.get('notes'), notes.data)
  const requiredAccords = parseIdList(searchParams.get('accords'), accords.data)
  const excludedNotes = parseIdList(searchParams.get('excludeNotes'), notes.data).filter(
    (id) => !requiredNotes.includes(id),
  )
  const excludedAccords = parseIdList(searchParams.get('excludeAccords'), accords.data).filter(
    (id) => !requiredAccords.includes(id),
  )

  const filters = {
    gender: parseGenders(searchParams.get('gender')),
    brand: resolveId(searchParams.get('brand'), brands.data),
    family: resolveId(searchParams.get('family'), families.data),
    notes: requiredNotes,
    excludeNotes: excludedNotes,
    accords: requiredAccords,
    excludeAccords: excludedAccords,
  }
  const listFilterCount =
    requiredNotes.length + excludedNotes.length + requiredAccords.length + excludedAccords.length
  const hasFilters =
    filters.gender.length > 0 || filters.brand !== null || filters.family !== null || listFilterCount > 0

  function setFilter(name, value) {
    setSearchParams((previous) => withFilter(previous, name, value))
  }

  function setList(name, oppositeName, ids) {
    setSearchParams((previous) => withIdList(previous, name, oppositeName, ids))
  }

  function clearFilters() {
    setSearchParams((previous) => withoutFilters(previous))
  }

  return {
    filters,
    brands,
    families,
    notes,
    accords,
    hasFilters,
    listFilterCount,
    listsOpen,
    setListsOpen,
    setFilter,
    setList,
    clearFilters,
  }
}