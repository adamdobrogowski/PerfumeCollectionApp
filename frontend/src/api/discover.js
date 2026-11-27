import { apiFetch } from './client.js'

export function fetchDiscover() {
  return apiFetch('/discover')
}