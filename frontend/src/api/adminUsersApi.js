// Клиент read-API админ-панели (форма справа подгружает карточку по people.id).
import { requestJson } from './http.js'

/**
 * Карточка для AdminUserFormPanel.
 * @param {number} peopleId
 * @returns {Promise<{
 *   id: number,
 *   usersId: number | null,
 *   fio: string | null,
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
