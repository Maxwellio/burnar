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

/** Заголовок карточки: { id, nameNar, hasZadanie, hasVipolnenie, zadanieClosed, vipolnenieClosed }. */
export function fetchNaryadHeader(id) {
  return requestJson(`/naryady/${id}`)
}

/** Текст алгоритма выбранной операции (пустой, если тип не 80). */
export function fetchNaryadAlgorithm(algorithmPath, nodeId) {
  return requestJson(`${algorithmPath}${buildQuery({ nodeId })}`)
}

/** Обновляет Delphi BGR-цвет одной строки задания или выполнения. */
export function updateNaryadRowColor(id, part, nodeId, color) {
  return requestJson(`/naryady/${id}/${part}/${nodeId}/color`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ color }),
  })
}

/** Обновляет цвет всех переданных строк одной части наряда. */
export function updateNaryadRowsColor(id, part, nodeIds, color) {
  return requestJson(`/naryady/${id}/${part}/colors`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ color, nodeIds }),
  })
}

