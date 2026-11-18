import { getDisplayName } from './names.js'

const NAME_SEPARATOR = ' · '

const collator = new Intl.Collator('pl')

export function normalizeText(text) {
  return text.toLowerCase().normalize('NFD').replace(/\p{M}/gu, '').replace(/ł/g, 'l')
}

export function toDictionaryOptions(items) {
  return items
    .map((item) => {
      const { main, other } = getDisplayName(item)
      const label = other ? `${main}${NAME_SEPARATOR}${other}` : main
      return { main, option: { value: String(item.id), label } }
    })
    .sort((a, b) => collator.compare(a.main, b.main))
    .map(({ option }) => option)
}


export function filterOptions({ options, search, limit }) {
  const query = normalizeText(search.trim())
  if (query === '') {
    return options.slice(0, limit)
  }
  const prefixMatches = []
  const otherMatches = []
  for (const option of options) {
    const names = option.label.split(NAME_SEPARATOR).map(normalizeText)
    if (names.some((name) => name.startsWith(query))) {
      prefixMatches.push(option)
    } else if (names.some((name) => name.includes(query))) {
      otherMatches.push(option)
    }
  }
  return [...prefixMatches, ...otherMatches].slice(0, limit)
}