import { apiFetch, ApiError } from './client.js'

// Zwraca zalogowanego użytkownika ({ userId, email, role }) albo null, gdy nie ma sesji (401).
export async function fetchCurrentUser() {
  try {
    return await apiFetch('/auth/me')
  } catch (error) {
    if (error instanceof ApiError && error.status === 401) {
      return null
    }
    throw error
  }
}

// Zwraca { userId, email, role }. Błędy (401, 403, 429...) zgłasza jako ApiError z komunikatem z backendu.
export function login(email, password) {
  return apiFetch('/auth/login', { method: 'POST', body: { email, password } })
}

// Backend odpowiada 204 bez treści.
export function logout() {
  return apiFetch('/auth/logout', { method: 'POST' })
}

// Backend od razu loguje nowego użytkownika. Zwraca { userId, email, role }.
// Błędy walidacji (400) mają pole fields z komunikatami dla pól, zajęty e-mail to 409.
export function register(email, password) {
  return apiFetch('/auth/register', { method: 'POST', body: { email, password } })
}