import { apiFetch, buildQuery } from './client.js'

async function fetchItems(path) {
  const data = await apiFetch(path)
  return data.items
}

// Marki: { id, name, country, perfumeCount }
export function fetchBrands() {
  return fetchItems('/brands')
}

// Akordy: { id, name, namePl, perfumeCount }
export function fetchAccords() {
  return fetchItems('/accords')
}

// Rodziny z podrodzinami: { id, name, description, perfumeCount, subfamilies: [...] }
export function fetchFamilies() {
  return fetchItems('/families')
}

// Nuty ogólne: { id, name, namePl, perfumeCount, specificNotes: [...] }
export function fetchNotes() {
  return fetchItems('/notes')
}

// Wyszukiwarka perfum. Zwraca { items, total, limit, offset }.
export function searchPerfumes(params) {
  return apiFetch(`/perfumes${buildQuery(params)}`)
}

// Karta perfum: { id, name, brand, family, releaseYear, gender, accords, sourceRating }
export function fetchPerfume(id) {
  return apiFetch(`/perfumes/${id}`)
}