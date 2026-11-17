// Zasady frazy wyszukiwania; takie same limity ma backend (catalog/perfume-search.js).
export const MIN_PHRASE_LENGTH = 3
export const MAX_PHRASE_LENGTH = 100
export const MAX_PHRASE_WORDS = 5

export const PHRASE_HINTS = {
  tooShort: `Wpisz co najmniej ${MIN_PHRASE_LENGTH} znaki, aby wyszukać.`,
  tooLong: `Fraza może mieć najwyżej ${MAX_PHRASE_LENGTH} znaków.`,
  tooManyWords: `Fraza może mieć najwyżej ${MAX_PHRASE_WORDS} słów.`,
}

export function normalizePhrase(text) {
  return text.trim().replace(/\s+/g, ' ')
}

export function getPhraseProblem(phrase) {
  if (phrase === '') {
    return null
  }
  const length = [...phrase].length
  if (length < MIN_PHRASE_LENGTH) {
    return 'tooShort'
  }
  if (length > MAX_PHRASE_LENGTH) {
    return 'tooLong'
  }
  if (phrase.split(' ').length > MAX_PHRASE_WORDS) {
    return 'tooManyWords'
  }
  return null
}

export function getSearchPhrase(urlValue) {
  const phrase = normalizePhrase(urlValue)
  return phrase !== '' && getPhraseProblem(phrase) === null ? phrase : undefined
}