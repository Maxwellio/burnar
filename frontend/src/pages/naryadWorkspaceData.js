/** Фильтр BaseTable параметров: nodeId уходит query-параметром, без выбора — пустой список. */
export function nodeIdFilters(selectedId) {
  if (selectedId == null || selectedId === '') {
    return []
  }
  return [{ id: 'nodeId', value: String(selectedId) }]
}
