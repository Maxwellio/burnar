/** Локальные правки ячеек дерева: расчёт и сброс нормы не перечитывают узлы. */

export function mergeWorkPatches(overrides, patches) {
  const next = new Map(overrides instanceof Map ? overrides : [])
  if (!Array.isArray(patches)) return next
  for (const patch of patches) {
    if (patch?.id == null || patch.id === '') continue
    const key = String(patch.id)
    const current = { ...(next.get(key) ?? {}) }
    for (const [field, value] of Object.entries(patch)) {
      if (field === 'id') continue
      current[field] = value
    }
    next.set(key, current)
  }
  return next
}

/** Значение ячейки: правка, в том числе пустая, важнее данных строки. */
export function workFieldValue(row, field, overrides) {
  const patch = overrides instanceof Map ? overrides.get(String(row?.id)) : undefined
  if (patch && Object.prototype.hasOwnProperty.call(patch, field)) {
    return patch[field] == null ? '' : patch[field]
  }
  const value = row?.[field]
  return value == null ? '' : value
}
