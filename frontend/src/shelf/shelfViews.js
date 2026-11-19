export const SHELF_VIEWS = {
  organization: {
    label: 'Zarządzanie kolekcją',
    sections: [
      {
        id: 'collection',
        title: 'Kolekcja',
        empty: 'Nie ma jeszcze perfum w kolekcji.',
        matches: (entry) => entry.placement === 'collection',
      },
      {
        id: 'wishlist',
        title: 'Lista życzeń',
        empty: 'Lista życzeń jest pusta.',
        matches: (entry) => entry.placement === 'wishlist',
      },
    ],
  },
  opinions: {
    label: 'Polubienia i opinie',
    sections: [
      {
        id: 'liked',
        title: 'Lubiane',
        empty: 'Nie ma jeszcze perfum oznaczonych jako Lubiane.',
        matches: (entry) => entry.opinion === 'liked',
        compare: (a, b) => b.entry.likeStrength - a.entry.likeStrength,
      },
      {
        id: 'disliked',
        title: 'Nielubiane',
        empty: 'Nie ma jeszcze perfum oznaczonych jako Nielubiane.',
        matches: (entry) => entry.opinion === 'disliked',
      },
    ],
  },
}

export function selectSectionItems(items, section) {
  const selected = items.filter((item) => section.matches(item.entry))
  return section.compare ? selected.sort(section.compare) : selected
}