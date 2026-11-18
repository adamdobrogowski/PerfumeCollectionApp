import { GENDER_LABELS } from './labels.js'

const MAX_INTEGER_ID = 2147483647

export const FILTER_KEYS = ['gender', 'brand', 'family']

const GENDERS = Object.keys(GENDER_LABELS)

// Płcie z adresu (np. "men,unisex") jako tablica w stałej kolejności.
export function parseGenders(text) {
  if (text === null) {
    return []
  }
  const parts = text.split(',').map((part) => part.trim())
  return GENDERS.filter((gender) => parts.includes(gender))
}

// Tekst do adresu z zaznaczonych płci albo null, gdy nic nie zaznaczono (brak filtru).
export function serializeGenders(values) {
  const genders = GENDERS.filter((gender) => values.includes(gender))
  return genders.length === 0 ? null : genders.join(',')
}

// Identyfikator z adresu (tekst): poprawna liczba całkowita w zakresie typu integer albo null.
export function parseId(text) {
  return text !== null && /^[1-9]\d{0,9}$/.test(text) && Number(text) <= MAX_INTEGER_ID ? text : null
}

export function resolveId(text, items) {
  const id = parseId(text)
  if (id === null) {
    return null
  }
  if (items === undefined) {
    return id
  }
  return items.some((item) => String(item.id) === id) ? id : null
}

export function withFilter(searchParams, name, value) {
  if (value === searchParams.get(name)) {
    return searchParams
  }
  const next = new URLSearchParams(searchParams)
  if (value === null) {
    next.delete(name)
  } else {
    next.set(name, value)
  }
  next.delete('page')
  return next
}

export function withoutFilters(searchParams) {
  const next = new URLSearchParams(searchParams)
  for (const key of FILTER_KEYS) {
    next.delete(key)
  }
  next.delete('page')
  return next
}