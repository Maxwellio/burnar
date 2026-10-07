/** Узлы текущего дерева по id. После перезагрузки здесь только уже пришедшие уровни. */
export function indexTreeNodes(nodes, map = new Map()) {
  if (!Array.isArray(nodes)) return map
  for (const node of nodes) {
    if (node?.id == null) continue
    map.set(String(node.id), node)
    if (Array.isArray(node.children)) indexTreeNodes(node.children, map)
  }
  return map
}

/**
 * Какие раскрытые узлы ещё без детей.
 * Узел глубже ещё не пришедшего родителя не запрашивается и не завершает восстановление.
 * Уже идущий запрос не повторяется, пока родительский уровень не догружен.
 */
export function expandedChildRequests(openIds, nodesById, inFlightIds) {
  const requestIds = []
  let pending = false
  const inFlight = inFlightIds instanceof Set ? inFlightIds : new Set()
  const ids = Array.isArray(openIds) ? openIds : []
  for (const rowId of ids) {
    const node = nodesById instanceof Map ? nodesById.get(String(rowId)) : undefined
    if (!node || !node.hasChildren || node.children || node.hasLoaded) continue
    pending = true
    if (inFlight.has(String(node.id))) continue
    requestIds.push(node.id)
  }
  return { requestIds, pending }
}
