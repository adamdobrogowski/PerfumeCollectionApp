import { apiFetch } from './client.js'

export function fetchNote(perfumeId) {
  return apiFetch(`/perfume-notes/${perfumeId}`)
}

export function saveNote(perfumeId, note) {
  return apiFetch(`/perfume-notes/${perfumeId}`, { method: 'PUT', body: note })
}

export function deleteNote(perfumeId) {
  return apiFetch(`/perfume-notes/${perfumeId}`, { method: 'DELETE' })
}