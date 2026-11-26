import { apiFetch, ApiError } from './client.js'

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

export async function login(email, password) {
  await apiFetch('/auth/login', { method: 'POST', body: { email, password } })
  return fetchCurrentUser()
}

export async function register(email, password, displayName) {
  await apiFetch('/auth/register', { method: 'POST', body: { email, password, displayName } })
  return fetchCurrentUser()
}

export function logout() {
  return apiFetch('/auth/logout', { method: 'POST' })
}
