// API страницы «Ответственные лица»: справочники, карточка, CRUD people.
import { request, requestJson } from './http.js'

/** @returns {Promise<Array<{ id: number, name: string }>>} */
export function fetchResponsiblePersonOrgUnits() {
  return requestJson('/responsible-persons/org-units')
}

/** @returns {Promise<Array<{ id: number, name: string }>>} */
export function fetchPositions() {
  return requestJson('/responsible-persons/positions')
}

/** Дерево подразделений с путём для комбо формы add. */
export function fetchOrgTree() {
  return requestJson('/responsible-persons/org-tree')
}

/** Карточка для формы edit. */
export function fetchResponsiblePerson(peopleId) {
  return requestJson(`/responsible-persons/${peopleId}`)
}

/**
 * @param {object} body
 * @returns {Promise<{ id: number }>}
 */
export function createResponsiblePerson(body) {
  return requestJson('/responsible-persons', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
}

export async function updateResponsiblePerson(peopleId, body) {
  const res = await request(`/responsible-persons/${peopleId}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    body: JSON.stringify(body),
  })
  if (!res.ok) {
    throw new Error(`Request failed: ${res.status}`)
  }
}

export async function deleteResponsiblePerson(peopleId) {
  const res = await request(`/responsible-persons/${peopleId}`, {
    method: 'DELETE',
    headers: { Accept: 'application/json' },
  })
  if (!res.ok) {
    throw new Error(`Request failed: ${res.status}`)
  }
}

/** Карточка карьеры для prefill формы. */
export function fetchCareer(peopleId, careerKey) {
  return requestJson(`/responsible-persons/${peopleId}/careers/${careerKey}`)
}

/**
 * Полное число карьер человека (без orgUnitId) — для предупреждения
 * при удалении последней (триггер БД удалит и пользователя).
 * @returns {Promise<number>}
 */
export async function fetchCareerTotal(peopleId) {
  const page = await requestJson(
    `/responsible-persons/${peopleId}/careers?page=0&size=1`,
  )
  return Number(page.totalElements) || 0
}

export async function createCareer(peopleId, body) {
  const res = await request(`/responsible-persons/${peopleId}/careers`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    body: JSON.stringify(body),
  })
  if (!res.ok) {
    throw new Error(`Request failed: ${res.status}`)
  }
}

export async function updateCareer(peopleId, careerKey, body) {
  const res = await request(`/responsible-persons/${peopleId}/careers/${careerKey}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    body: JSON.stringify(body),
  })
  if (!res.ok) {
    throw new Error(`Request failed: ${res.status}`)
  }
}

export async function deleteCareer(peopleId, careerKey) {
  const res = await request(`/responsible-persons/${peopleId}/careers/${careerKey}`, {
    method: 'DELETE',
    headers: { Accept: 'application/json' },
  })
  if (!res.ok) {
    throw new Error(`Request failed: ${res.status}`)
  }
}
