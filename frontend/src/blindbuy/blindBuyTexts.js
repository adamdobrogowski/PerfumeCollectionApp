const LEVEL_VIEWS = {
  0: { color: 'green', title: 'Małe ryzyko', message: 'Te perfumy pasują do tego, co lubisz.' },
  1: { color: 'yellow', title: 'Umiarkowane ryzyko', message: 'Te perfumy częściowo odbiegają od tego, co lubisz.' },
  2: { color: 'red', title: 'Duże ryzyko', message: 'Te perfumy wyraźnie odbiegają od tego, co lubisz.' },
}

const CONFIDENCE_NOTES = {
  high: 'wysoka (masz co najmniej 3 Lubianych w tej podrodzinie)',
  medium: 'średnia (oceniamy na podstawie Lubianych z całej rodziny zapachowej, bo w tej podrodzinie masz ich za mało)',
  low: 'niska (w tej grupie masz mniej niż 3 Lubianych)',
}

export function formatPerfume(perfume) {
  return `${perfume.brand.name} ${perfume.name}`
}

export function getBlindBuyView(check) {
  switch (check.state) {
    case 'already_liked':
      return { color: 'blue', title: 'Już lubiane', message: 'Te perfumy należą już do Twoich Lubianych.' }
    case 'very_close_other_family':
      return {
        color: 'green',
        title: 'Małe ryzyko',
        message: `Bardzo podobne do perfum, które lubisz: ${formatPerfume(check.nearestLiked)}.`,
      }
    case 'unknown':
      return {
        color: 'gray',
        title: 'Brak oceny',
        message: `Nie znamy jeszcze Twojego gustu w rodzinie zapachowej: ${check.family.name}. Nie możemy ocenić ryzyka.`,
      }
    default:
      return LEVEL_VIEWS[check.level] ?? { color: 'gray', title: 'Brak oceny', message: 'Nie udało się ocenić ryzyka.' }
  }
}

export function getConfidenceNote(confidence) {
  return CONFIDENCE_NOTES[confidence] ?? null
}