import { LIKE_LEVELS } from './shelfState.js'

export const REMOVE_CONFIRMATIONS = {
  collection: {
    title: 'Usunąć z kolekcji?',
    message: 'Twoje opinie (Lubiane i Nielubiane) pozostaną bez zmian.',
    confirmLabel: 'Usuń',
  },
  wishlist: {
    title: 'Usunąć z listy życzeń?',
    message: 'Perfumy znikną z listy życzeń. Twoje opinie pozostaną bez zmian.',
    confirmLabel: 'Usuń',
  },
  liked: {
    title: 'Usunąć z Lubianych?',
    message: 'Perfumy przestaną wpływać na Twoje rekomendacje.',
    confirmLabel: 'Usuń',
  },
  disliked: {
    title: 'Usunąć z Nielubianych?',
    message: 'Perfumy przestaną być uwzględniane w ostrzeżeniach o zbyt dużym podobieństwie.',
    confirmLabel: 'Usuń',
  },
}

export function getDislikeConfirmation(state) {
  const isLiked = state.opinion === 'liked'
  const isOnWishlist = state.placement === 'wishlist'

  if (!isLiked && !isOnWishlist) {
    return null
  }

  const messages = []
  if (isLiked) {
    const levelLabel = LIKE_LEVELS.find((level) => level.strength === state.likeStrength)?.label
    messages.push(`Perfumy są w Lubianych (ocena: ${levelLabel}). Przeniesienie do Nielubianych usunie tę ocenę.`)
  }
  if (isOnWishlist) {
    messages.push(
      isLiked
        ? 'Zostaną też usunięte z listy życzeń.'
        : 'Perfumy są na liście życzeń. Przeniesienie do Nielubianych usunie je z listy życzeń.',
    )
  }

  return { title: 'Przenieść do Nielubianych?', message: messages.join(' '), confirmLabel: 'Przenieś' }
}