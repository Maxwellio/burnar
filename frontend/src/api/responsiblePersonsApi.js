// Справочник СП для Select «структура» на странице ответственных лиц (id 1,5,6,7,8,123).
import { requestJson } from './http.js'

/** @returns {Promise<Array<{ id: number, name: string }>>} */
export function fetchResponsiblePersonOrgUnits() {
  return requestJson('/responsible-persons/org-units')
}
