import { apiFetch } from './client.js'

export function saveOnboarding(liked, disliked) {
  return apiFetch('/onboarding', { method: 'POST', body: { liked, disliked } })
}