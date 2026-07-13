// Единая точка HTTP к backend: относительный /api + cookie-сессия.
// В dev Vite проксирует /api на :8095 (см. vite.config.js).
export const API_BASE = '/api'

function withBase(path) {
  return `${API_BASE}${path}`
}

export async function request(path, options = {}) {
  const { headers = {}, ...rest } = options
  // credentials: 'include' — браузер шлёт/принимает JSESSIONID (нужно для будущего session-login).
  const res = await fetch(withBase(path), {
    credentials: 'include',
    headers,
    ...rest,
  })
  if (res.status === 401 && path !== '/login') {
    window.location.replace('/login')
    throw new Error('Session expired')
  }
  return res
}

export async function requestJson(path, options = {}) {
  const res = await request(path, {
    headers: { Accept: 'application/json', ...(options.headers || {}) },
    ...options,
  })
  if (!res.ok) {
    throw new Error(`Request failed: ${res.status}`)
  }
  return res.json()
}

export function buildQuery(params) {
  const query = new URLSearchParams()
  Object.entries(params).forEach(([key, value]) => {
    if (value == null) return
    if (typeof value === 'string' && value.trim() === '') return
    query.set(key, String(value).trim())
  })
  const serialized = query.toString()
  return serialized ? `?${serialized}` : ''
}
