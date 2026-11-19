import { apiFetch } from './client.js'

export function fetchShelfEntry(perfumeId) {
  return apiFetch(`/shelf/${perfumeId}`)
}

export function saveShelfEntry(perfumeId, state) {
  return apiFetch(`/shelf/${perfumeId}`, { method: 'PUT', body: state })
}