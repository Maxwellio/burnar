// API списка нарядов и дерева месяцев для боковой панели DynamicDateList.
import { buildQuery, requestJson } from './http.js'

/** @returns {Promise<Array<{ year: number, month: string[] }>>} */
export function fetchNaryadyPeriods(dateMode = 0, orgUnitId) {
  return requestJson(
    `/naryady/periods${buildQuery({
      dateMode,
      orgUnitId: orgUnitId == null || orgUnitId === '' ? undefined : orgUnitId,
    })}`,
  )
}

/** Заголовок карточки: { id, nameNar }. */
export function fetchNaryadHeader(id) {
  return requestJson(`/naryady/${id}`)
}

