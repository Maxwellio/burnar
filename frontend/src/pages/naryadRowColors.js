export const NARYAD_DEFAULT_PICKER_COLOR = '#ffff00'

/** Готовые цвета маркировки. Чёрный не входит: в Delphi он совпадает с «цвета нет». */
export const NARYAD_COLOR_SWATCHES = [
  { label: 'Жёлтый', css: '#ffff00' },
  { label: 'Оранжевый', css: '#ff8000' },
  { label: 'Красный', css: '#ff0000' },
  { label: 'Розовый', css: '#ff80ff' },
  { label: 'Зелёный', css: '#00b050' },
  { label: 'Салатовый', css: '#92d050' },
  { label: 'Голубой', css: '#00b0f0' },
  { label: 'Синий', css: '#0070c0' },
  { label: 'Фиолетовый', css: '#7030a0' },
  { label: 'Серый', css: '#808080' },
]

export function delphiColorToCss(value) {
  if (!Number.isInteger(value) || value <= 0 || value > 0xffffff) {
    return undefined
  }

  const r = value & 0xff
  const g = (value >> 8) & 0xff
  const b = (value >> 16) & 0xff

  return `#${[r, g, b]
    .map((channel) => channel.toString(16).padStart(2, '0'))
    .join('')}`
}

export function cssColorToDelphi(value) {
  if (typeof value !== 'string' || !/^#[0-9a-f]{6}$/i.test(value)) {
    throw new TypeError('Expected a CSS color in #rrggbb format')
  }

  const r = Number.parseInt(value.slice(1, 3), 16)
  const g = Number.parseInt(value.slice(3, 5), 16)
  const b = Number.parseInt(value.slice(5, 7), 16)

  return (b << 16) | (g << 8) | r
}

export function rowBackgroundColor(row, overrides) {
  const color = overrides.has(row.id) ? overrides.get(row.id) : row.colorsel
  return delphiColorToCss(color)
}

export function canChangeRowColor(selectedId, closed, pending = false) {
  const selected = Array.isArray(selectedId)
    ? selectedId.length > 0
    : selectedId != null
  return selected && closed !== true && !pending
}

export const NARYAD_RECENT_ROW_COLORS_KEY = 'naryad-recent-row-colors'
export const NARYAD_RECENT_ROW_COLOR_LIMIT = 5

function recentRowColorCss(value) {
  if (typeof value !== 'string') return undefined
  const css = value.trim().toLowerCase()
  if (!/^#[0-9a-f]{6}$/.test(css) || css === '#000000') return undefined
  return css
}

function sameRecentRowColors(left, right) {
  return left.length === right.length && left.every((color, index) => color === right[index])
}

function collectRecentRowColors(colors) {
  if (!Array.isArray(colors)) return []
  const result = []
  for (const item of colors) {
    const css = recentRowColorCss(item)
    if (!css || result.includes(css)) continue
    result.push(css)
    if (result.length === NARYAD_RECENT_ROW_COLOR_LIMIT) break
  }
  return result
}

/** Последний подтверждённый свой цвет становится первым. Чёрный и мусор не попадают в список. */
export function rememberRecentRowColor(colors, css) {
  const current = collectRecentRowColors(colors)
  const normalized = recentRowColorCss(css)
  if (!normalized) return sameRecentRowColors(current, colors) ? colors : current
  const next = [normalized, ...current.filter((item) => item !== normalized)]
    .slice(0, NARYAD_RECENT_ROW_COLOR_LIMIT)
  return sameRecentRowColors(next, colors) ? colors : next
}

export function parseRecentRowColors(raw) {
  if (typeof raw !== 'string') return []
  try {
    return collectRecentRowColors(JSON.parse(raw))
  } catch {
    return []
  }
}

export function readRecentRowColors(storage = globalThis.localStorage) {
  try {
    return parseRecentRowColors(storage?.getItem(NARYAD_RECENT_ROW_COLORS_KEY))
  } catch {
    return []
  }
}

export function writeRecentRowColors(colors, storage = globalThis.localStorage) {
  try {
    storage?.setItem(
      NARYAD_RECENT_ROW_COLORS_KEY,
      JSON.stringify(collectRecentRowColors(colors)),
    )
  } catch {
    // localStorage может быть недоступен.
  }
}

export function withRowColorOverride(overrides, nodeId, color) {
  const next = new Map(overrides)
  next.set(nodeId, color)
  return next
}

export function colorOverrideBaseline(overrides, nodeId) {
  return {
    nodeId,
    had: overrides.has(nodeId),
    color: overrides.get(nodeId),
  }
}

export function withoutUnsavedColorOverride(overrides, baseline) {
  const next = new Map(overrides)
  if (!baseline) return next
  if (baseline.had) next.set(baseline.nodeId, baseline.color)
  else next.delete(baseline.nodeId)
  return next
}

export function withRowColorOverrides(overrides, nodeIds, color) {
  const next = new Map(overrides)
  for (const nodeId of nodeIds) next.set(nodeId, color)
  return next
}

export function colorOverrideBaselines(overrides, nodeIds) {
  return nodeIds.map((nodeId) => colorOverrideBaseline(overrides, nodeId))
}

export function withoutUnsavedColorOverrides(overrides, baselines) {
  return (baselines ?? []).reduce(
    (current, baseline) => withoutUnsavedColorOverride(current, baseline),
    new Map(overrides),
  )
}
