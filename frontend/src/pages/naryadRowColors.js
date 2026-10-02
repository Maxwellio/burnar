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
  return selectedId != null && closed !== true && !pending
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
