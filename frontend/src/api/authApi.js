import { request } from './http.js'

/**
 * Auth API: session-login через Spring Security (cookie JSESSIONID).
 * login шлёт form-urlencoded — так ожидает formLogin на POST /api/login.
 */

export async function login(username, password) {
  return request('/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({ username, password }).toString(),
  })
}

export async function getCurrentUser() {
  const res = await request('/current-user', {
    method: 'GET',
    headers: { Accept: 'application/json' },
  })
  // 401 здесь нормален (не залогинен) — не бросаем, AuthContext получит null
  if (res.status === 401) return null
  if (!res.ok) throw new Error(`getCurrentUser failed: ${res.status}`)
  return res.json()
}

export async function logout() {
  const res = await request('/logout', {
    method: 'POST',
    headers: { Accept: 'application/json' },
  })
  if (!res.ok) throw new Error(`logout failed: ${res.status}`)
  return res.json()
}
