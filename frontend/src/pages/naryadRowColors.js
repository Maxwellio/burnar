export const NARYAD_DEFAULT_PICKER_COLOR = '#ffff00'

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
