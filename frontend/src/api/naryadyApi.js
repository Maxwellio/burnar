// API списка нарядов и дерева месяцев для боковой панели DynamicDateList.
import { buildQuery, request, requestJson } from './http.js'

/** Текст Spring `message` (отказ процедуры, незаблокированные работы) важнее голого статуса. */
async function requestAction(path, options = {}) {
  const res = await request(path, {
    headers: { Accept: 'application/json', ...(options.headers || {}) },
    ...options,
  })
  if (!res.ok) {
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
  if (res.status === 204) return null
  return res.json()
}

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

/** Сумма листьев: задание { duration }, выполнение { normDuration, factDuration }. */
export function fetchNaryadTotals(id, part) {
  return requestJson(`/naryady/${id}/${part}/totals`)
}

/** closed: true закрывает часть от изменений, false открывает. */
export function setNaryadPartClosed(id, part, closed) {
  return requestAction(`/naryady/${id}/${part}/closed`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ closed }),
  })
}

/** Признаки locked всех работ выполнения: [{ id, locked }]. Один раз на загрузку дерева. */
export function fetchNaryadWorkLocks(id) {
  return requestJson(`/naryady/${id}/vipolnenie/lock-flags`)
}

/** Блокировка выполнения: сервер берёт самую позднюю выбранную строку. */
export function lockNaryadWorks(id, nodeIds) {
  return requestAction(`/naryady/${id}/vipolnenie/lock`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ nodeIds }),
  })
}

/** Разблокировка выполнения: сервер берёт самую раннюю выбранную строку. */
export function unlockNaryadWorks(id, nodeIds) {
  return requestAction(`/naryady/${id}/vipolnenie/unlock`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ nodeIds }),
  })
}

/** Поля единственной строки для кнопки «удалить блок без вложенных работ». */
export function fetchNaryadWorkAction(id, part, nodeId) {
  return requestJson(`/naryady/${id}/${part}/nodes/${nodeId}/action`)
}

/** actDelSelOpers: одна или несколько выбранных работ, вместе с вложенными. */
export function deleteNaryadWorks(id, part, nodeIds) {
  return requestAction(`/naryady/${id}/${part}/works/delete`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ nodeIds }),
  })
}

/** act*_del_block: снять блок и поднять вложенные работы на его уровень. */
export function deleteNaryadBlock(id, part, nodeId) {
  return requestAction(`/naryady/${id}/${part}/blocks/${nodeId}/delete`, {
    method: 'POST',
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

