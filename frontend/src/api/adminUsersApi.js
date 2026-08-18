// Клиент API админ-панели: карточка справа и сохранение учётки.
import { request, requestJson } from './http.js'

/**
 * Карточка для AdminUserFormPanel.
 * @param {number} peopleId
 * @returns {Promise<{
 *   id: number,
 *   usersId: number | null,
 *   fio: string | null,
 *   fioreports: string | null,
 *   fiorodpad: string | null,
 *   oraName: string | null,
 *   active: number | null,
 *   dtEnter: string | null,
 *   dtOut: string | null,
 *   note: string | null,
 * }>}
 */
export function fetchAdminUser(peopleId) {
  return requestJson(`/admin/users/${peopleId}`)
}

/** Текст Spring `message` (409 логина) важнее голого статуса. */
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
 * @param {object} body
 * @returns {Promise<{ id: number }>}
 */
export async function createAdminUser(body) {
  const res = await request('/admin/users', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    body: JSON.stringify(body),
  })
  await throwIfNotOk(res)
  return res.json()
}

export async function updateAdminUser(peopleId, body) {
  const res = await request(`/admin/users/${peopleId}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    body: JSON.stringify(body),
  })
  await throwIfNotOk(res)
}
