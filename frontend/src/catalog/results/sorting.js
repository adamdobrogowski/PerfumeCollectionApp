export const SORT_LABELS = {
  relevance: 'Trafność',
  popular: 'Popularność',
  newest: 'Najnowsze',
  name: 'Nazwa (A–Z)',
}

export function getDefaultSort(hasPhrase) {
  return hasPhrase ? 'relevance' : 'popular'
}

export function parseSort(text, hasPhrase) {
  const isKnown = text !== null && Object.hasOwn(SORT_LABELS, text)
  return isKnown && (text !== 'relevance' || hasPhrase) ? text : getDefaultSort(hasPhrase)
}


export function withSort(searchParams, sort, hasPhrase) {
  if (sort === parseSort(searchParams.get('sort'), hasPhrase)) {
    return searchParams
  }
  const next = new URLSearchParams(searchParams)
  if (sort === getDefaultSort(hasPhrase)) {
    next.delete('sort')
  } else {
    next.set('sort', sort)
  }
  next.delete('page')
  return next
}