import { apiFetch } from './client.js'

export function fetchBlindBuyCheck(perfumeId) {
  return apiFetch(`/perfumes/${perfumeId}/blind-buy-check`)
}