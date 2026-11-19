import { GENDER_LABELS } from '../../shared/perfume/labels.js'

const MAX_INTEGER_ID = 2147483647

export const LIST_FILTER_KEYS = ['notes', 'excludeNotes', 'accords', 'excludeAccords']

export const FILTER_KEYS = ['gender', 'brand', 'family', ...LIST_FILTER_KEYS]

export const MAX_LIST_ITEMS = 10

const GENDERS = Object.keys(GENDER_LABELS)

export function parseGenders(text) {
  if (text === null) {
    return []
  }
  const parts = text.split(',').map((part) => part.trim())
  return GENDERS.filter((gender) => parts.includes(gender))
}

export function serializeGenders(values) {
  const genders = GENDERS.filter((gender) => values.includes(gender))
  return genders.length === 0 ? null : genders.join(',')
}

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

export function parseIdList(text, items) {
  if (text === null) {
    return []
  }
  const ids = []
  for (const part of text.split(',')) {
    const id = resolveId(part.trim(), items)
    if (id !== null && !ids.includes(id)) {
      ids.push(id)
    }
  }
  return ids.slice(0, MAX_LIST_ITEMS)
}

function setList(searchParams, name, ids) {
  if (ids.length === 0) {
    searchParams.delete(name)
  } else {
    searchParams.set(name, ids.join(','))
  }
}

export function withIdList(searchParams, name, oppositeName, ids) {
  const next = new URLSearchParams(searchParams)
  setList(next, name, ids)
  const opposite = parseIdList(next.get(oppositeName), undefined).filter((id) => !ids.includes(id))
  setList(next, oppositeName, opposite)
  if (next.toString() === searchParams.toString()) {
    return searchParams
  }
  next.delete('page')
  return next
}