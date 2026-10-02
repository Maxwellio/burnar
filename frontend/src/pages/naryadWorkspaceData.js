/** Счётчик фильтров параметров: смена выбора отменяет предыдущий запрос. */
export function nextParamsRequestId(requestId) {
  return requestId + 1
}

/** Фильтр BaseTable параметров: nodeId уходит query-параметром, без выбора — пустой список. */
export function nodeIdFilters(selectedId) {
  if (selectedId == null || selectedId === '') {
    return []
  }
  return [{ id: 'nodeId', value: String(selectedId) }]
}

/** Текст строки состояния дерева; без выбранной записи полоса остаётся пустой. */
export function selectedNodeStatusText(selectedId) {
  if (selectedId == null || selectedId === '') {
    return ''
  }
  return `Код: ${String(selectedId)}`
}
