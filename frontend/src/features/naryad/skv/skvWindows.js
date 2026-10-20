/**
 * Список открытых окон сквозных параметров в порядке наложения: последнее — сверху.
 * Элемент: { partId, position } — position задаёт место при открытии.
 */

export function openSkvWindow(windows, partId, position) {
  if (windows.some((item) => item.partId === partId)) {
    return activateSkvWindow(windows, partId)
  }
  return [...windows, { partId, position }]
}

export function activateSkvWindow(windows, partId) {
  const index = windows.findIndex((item) => item.partId === partId)
  if (index < 0 || index === windows.length - 1) return windows
  return [...windows.slice(0, index), ...windows.slice(index + 1), windows[index]]
}

export function closeSkvWindow(windows, partId) {
  const next = windows.filter((item) => item.partId !== partId)
  return next.length === windows.length ? windows : next
}

/** Окно, рядом с которым открывается новое: явно указанное или любое уже открытое. */
export function skvOpenerId(windows, partId, besideOf) {
  if (besideOf && windows.some((item) => item.partId === besideOf)) return besideOf
  return windows.find((item) => item.partId !== partId)?.partId ?? null
}
