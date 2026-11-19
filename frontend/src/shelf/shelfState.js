// Stan półki dla jednych perfum: { opinion: 'liked' | 'disliked' | null, likeStrength: 1-3 | null, placement: 'collection' | 'wishlist' | null }.

export const LIKE_LEVELS = [
  { strength: 1, label: 'Lubię' },
  { strength: 2, label: 'Bardzo lubię' },
  { strength: 3, label: 'Kocham' },
]

export const DEFAULT_LIKE_STRENGTH = 2

export const EMPTY_STATE = { opinion: null, likeStrength: null, placement: null }

export function toState(entry) {
  return entry ?? EMPTY_STATE
}

export function withLiked(state, strength) {
  return { ...state, opinion: 'liked', likeStrength: strength }
}

export function withoutOpinion(state) {
  return { ...state, opinion: null, likeStrength: null }
}

export function withDisliked(state) {
  return {
    opinion: 'disliked',
    likeStrength: null,
    placement: state.placement === 'wishlist' ? null : state.placement,
  }
}

export function withPlacement(state, placement) {
  return { ...state, placement }
}

export function withoutPlacement(state) {
  return { ...state, placement: null }
}

export function needsWishlistConfirmation(state) {
  return state.placement === 'wishlist'
}

export function isWishlistBlocked(state) {
  return state.opinion === 'disliked'
}