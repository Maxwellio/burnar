// API списка нарядов и дерева месяцев для боковой панели DynamicDateList.
import { buildQuery, requestJson } from './http.js'

/** @returns {Promise<Array<{ year: number, month: string[] }>>} */
export function fetchNaryadyPeriods(dateMode = 0) {
  return requestJson(`/naryady/periods${buildQuery({ dateMode })}`)
}
