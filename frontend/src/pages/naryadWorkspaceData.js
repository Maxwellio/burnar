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

/** Параметры и алгоритм показываются только для единственной выбранной строки. */
export function detailNodeId(selectedIds) {
  if (!Array.isArray(selectedIds) || selectedIds.length !== 1) return null
  const id = selectedIds[0]
  if (id == null || id === '') return null
  return id
}

/** Одна строка — её код, несколько — число выбранных, пустой набор — пустая полоса. */
export function treeSelectionStatusText(selectedIds) {
  if (!Array.isArray(selectedIds) || selectedIds.length === 0) return ''
  if (selectedIds.length === 1) return `Код: ${String(selectedIds[0])}`
  return `Выбрано: ${selectedIds.length}`
}
