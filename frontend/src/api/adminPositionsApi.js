// CRUD справочника должностей (админ-модалка → /api/admin/positions).
import { request, requestJson } from './http.js'

/** Текст Spring `message` (409 занятости) важнее голого статуса. */
async function throwIfNotOk(res) {
  if (res.ok) return
  let message = `Request failed: ${res.status}`
  try {
    const data = await res.json()
    if (typeof data?.message === 'string' && data.message.trim()) {
      message = data.message
    }
  } catch {
    // не JSON — оставляем статус
  }
  throw new Error(message)
}

/**
 * Карточка для формы редактирования.
 * @param {number} id sprdoljnost.key
 * @returns {Promise<{ id: number, nm: string | null }>}
 */
export function fetchPosition(id) {
  return requestJson(`/admin/positions/${id}`)
}

/**
 * @param {{ nm: string }} body
 * @returns {Promise<{ id: number }>}
 */
export async function createPosition(body) {
  const res = await request('/admin/positions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    body: JSON.stringify(body),
  })
  await throwIfNotOk(res)
  return res.json()
}

export async function updatePosition(id, body) {
  const res = await request(`/admin/positions/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    body: JSON.stringify(body),
  })
  await throwIfNotOk(res)
}

export async function deletePosition(id) {
  const res = await request(`/admin/positions/${id}`, {
    method: 'DELETE',
    headers: { Accept: 'application/json' },
  })
  await throwIfNotOk(res)
}
