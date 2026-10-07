/** Следующий набор строк дерева по обычному клику, Ctrl/Cmd и Shift. */
export function nextTreeSelection({
  visibleIds,
  selectedIds,
  anchorId,
  clickedId,
  shiftKey,
  toggleKey,
}) {
  const visible = Array.isArray(visibleIds) ? visibleIds : []
  const selected = Array.isArray(selectedIds) ? selectedIds : []
  const rangeReady = Boolean(shiftKey)
    && anchorId != null
    && visible.includes(anchorId)
    && visible.includes(clickedId)

  if (rangeReady) {
    const start = visible.indexOf(anchorId)
    const end = visible.indexOf(clickedId)
    const from = Math.min(start, end)
    const to = Math.max(start, end)
    const range = visible.slice(from, to + 1)
    if (toggleKey) {
      const next = new Set(selected)
      for (const id of range) next.add(id)
      return { selectedIds: orderSelection(visible, next), anchorId }
    }
    return { selectedIds: range, anchorId }
  }

  if (toggleKey) {
    const next = new Set(selected)
    if (next.has(clickedId)) next.delete(clickedId)
    else next.add(clickedId)
    return { selectedIds: orderSelection(visible, next), anchorId: clickedId }
  }

  return { selectedIds: [clickedId], anchorId: clickedId }
}

function orderSelection(visibleIds, selectedSet) {
  const visible = visibleIds.filter((id) => selectedSet.has(id))
  const hidden = []
  for (const id of selectedSet) {
    if (!visibleIds.includes(id)) hidden.push(id)
  }
  return [...visible, ...hidden]
}
