// Справочник оргединиц для админского Select «структура».
import { requestJson } from './http.js'

/** @returns {Promise<Array<{ id: number, name: string }>>} */
export function fetchOrgUnits() {
  return requestJson('/org-units')
}
