/** Минимальная ширина колонки, пока окно само шире этой суммы. */
export const SKV_COLUMN_MIN = 40

function positive(value, fallback) {
  const number = Number(value)
  return Number.isFinite(number) && number > 0 ? number : fallback
}

/**
 * Целые доли, которые в сумме дают total. Нулевые веса делят total поровну.
 * @param {number[]} weights
 * @param {number} total
 */
export function distributeColumnShares(weights, total) {
  const count = weights.length
  if (count === 0) return []
  const safeTotal = Math.max(0, Math.round(total))
  const safeWeights = weights.map((weight) => (weight > 0 ? weight : 0))
  const sum = safeWeights.reduce((acc, weight) => acc + weight, 0)
  const raw = sum > 0
    ? safeWeights.map((weight) => (weight / sum) * safeTotal)
    : safeWeights.map(() => safeTotal / count)
  const shares = raw.map((value) => Math.floor(value))
  let left = safeTotal - shares.reduce((acc, value) => acc + value, 0)
  const byFraction = raw
    .map((value, index) => ({ index, frac: value - Math.floor(value) }))
    .sort((a, b) => b.frac - a.frac || a.index - b.index)
  let cursor = 0
  while (left > 0 && byFraction.length > 0) {
    shares[byFraction[cursor % byFraction.length].index] += 1
    left -= 1
    cursor += 1
  }
  while (left < 0) {
    const index = shares.findIndex((value) => value > 0)
    if (index < 0) break
    shares[index] -= 1
    left += 1
  }
  return shares
}

function columnMin(width, count, min) {
  if (!(width > 0) || count <= 0) return min
  return Math.max(1, Math.min(min, Math.floor(width / count)))
}

/**
 * Начальные ширины: сохранённые значения BaseTable, иначе size колонки.
 * @param {Array<{ id: string, size?: number }>} columns
 * @param {Record<string, number>|null|undefined} saved
 */
export function readColumnSizes(columns, saved) {
  const sizes = {}
  for (const column of columns) {
    sizes[column.id] = positive(saved?.[column.id], positive(column.size, SKV_COLUMN_MIN))
  }
  return sizes
}

/**
 * Пропорции сохраняются, сумма равна ширине окна.
 * Каждая колонка не уже min, пока окно вмещает этот минимум.
 */
export function fitColumnSizes(sizes, order, width, min = SKV_COLUMN_MIN) {
  const count = order.length
  if (count === 0 || !(width > 0)) return {}
  const floor = columnMin(width, count, min)
  const target = Math.max(Math.round(width), count * floor)
  const extra = target - count * floor
  const weights = order.map((id) => Math.max(0, positive(sizes?.[id], floor) - floor))
  const shares = distributeColumnShares(weights, extra)
  const next = {}
  order.forEach((id, index) => {
    next[id] = floor + shares[index]
  })
  return next
}

/**
 * Граница колонки следует за курсором, правое поле окна стоит на месте.
 * Колонки слева не двигаются. Разницу забирают колонки справа.
 * У последней колонки справа никого нет, поэтому разницу отдают колонки слева.
 */
export function resizeColumn(sizes, order, id, requested, width, min = SKV_COLUMN_MIN) {
  const index = order.indexOf(id)
  if (index < 0) return fitColumnSizes(sizes, order, width, min)
  const count = order.length
  const floor = columnMin(width, count, min)
  const target = Math.max(Math.round(width), count * floor)
  const flexIds = index < count - 1 ? order.slice(index + 1) : order.slice(0, index)
  const fixedIds = order.filter((item) => item !== id && !flexIds.includes(item))
  const fixedSum = fixedIds.reduce((sum, item) => sum + positive(sizes?.[item], floor), 0)
  const nextSize = Math.min(
    Math.max(floor, target - fixedSum - flexIds.length * floor),
    Math.max(floor, Math.round(requested)),
  )
  const extra = target - fixedSum - nextSize - flexIds.length * floor
  const weights = flexIds.map((item) => Math.max(0, positive(sizes?.[item], floor) - floor))
  const shares = distributeColumnShares(weights, Math.max(0, extra))
  const next = { [id]: nextSize }
  for (const item of fixedIds) next[item] = positive(sizes?.[item], floor)
  flexIds.forEach((item, flexIndex) => {
    next[item] = floor + shares[flexIndex]
  })
  return next
}

export function sameColumnSizes(left, right) {
  const keys = new Set([...Object.keys(left ?? {}), ...Object.keys(right ?? {})])
  for (const key of keys) {
    if (left?.[key] !== right?.[key]) return false
  }
  return true
}

export function columnSizesTotal(sizes, order) {
  return order.reduce((sum, id) => sum + (sizes?.[id] ?? 0), 0)
}

/**
 * Пиксели BaseTable заменяются долями окна: таблица остаётся шириной контейнера.
 * Повторный вызов с теми же числами не трогает style, чтобы не зациклить наблюдатель.
 * @param {ParentNode} root
 * @param {string[]} order
 * @param {Record<string, number>} sizes
 */
export function applyColumnWidths(root, order, sizes) {
  const table = root?.querySelector?.('table')
  if (!table || order.length === 0) return false
  const total = columnSizesTotal(sizes, order)
  if (!(total > 0)) return false
  let changed = false
  const setWidth = (element, value) => {
    if (element.style.width !== value) {
      element.style.width = value
      changed = true
    }
  }
  for (const row of table.querySelectorAll('tr')) {
    const cells = [...row.children].filter((cell) => cell.tagName === 'TH' || cell.tagName === 'TD')
    if (cells.length !== order.length) continue
    cells.forEach((cell, index) => {
      setWidth(cell, `${(sizes[order[index]] / total) * 100}%`)
    })
  }
  setWidth(table, '100%')
  if (table.style.maxWidth !== '100%') {
    table.style.maxWidth = '100%'
    changed = true
  }
  if (table.style.minWidth !== '0px') {
    table.style.minWidth = '0px'
    changed = true
  }
  return changed
}
