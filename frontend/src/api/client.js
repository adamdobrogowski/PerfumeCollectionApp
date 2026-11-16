// Jedyne miejsce, które zna adres API i format błędów backendu.
const API_BASE = '/api/v1'

export class ApiError extends Error {
  constructor(status, message, fields = null) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.fields = fields
  }
}

export async function apiFetch(path, { method = 'GET', body } = {}) {
  let response
  try {
    response = await fetch(`${API_BASE}${path}`, {
      method,
      headers: body === undefined ? undefined : { 'Content-Type': 'application/json' },
      body: body === undefined ? undefined : JSON.stringify(body),
      // Ciasteczko sesji jest wysyłane automatycznie, bo przeglądarka widzi jedną domenę.
      credentials: 'same-origin',
    })
  } catch {
    throw new ApiError(0, 'Brak połączenia z serwerem.')
  }

  if (response.status === 204) {
    return null
  }

  let data = null
  try {
    data = await response.json()
  } catch {
    // Odpowiedź bez poprawnego JSON-a: zostaje data = null.
  }

  if (!response.ok) {
    throw new ApiError(response.status, data?.message ?? 'Wystąpił nieoczekiwany błąd.', data?.fields ?? null)
  }
  return data
}