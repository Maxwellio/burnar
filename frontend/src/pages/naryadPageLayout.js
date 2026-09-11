/** Высота action bar карточки наряда — как Toolbar в ProtectedLayout (minHeight 48). */
export const ACTION_BAR_HEIGHT = 48

/** Прежний общий ключ — читаем как fallback, новые записи идут в per-tab ключи. */
export const RIGHT_PANEL_WIDTH_KEY = 'naryad-right-panel-width'
export const RIGHT_PANEL_WIDTH_KEYS = {
  zad: 'naryad-right-panel-width:zad',
  vip: 'naryad-right-panel-width:vip',
}

export const RIGHT_PANEL_DEFAULT_RATIO = 0.25
export const RIGHT_PANEL_MIN = 180
export const LEFT_PANEL_MIN = 360
export const RIGHT_PANEL_MAX_RATIO = 0.5

/** Стабильные ключи раскладки колонок (не зависят от id наряда). */
export const COLUMN_SIZING_KEYS = {
  zadanieTree: 'naryad-column-sizing:zadanie-tree',
  zadanieParams: 'naryad-column-sizing:zadanie-params',
  vipolnenieTree: 'naryad-column-sizing:vipolnenie-tree',
  vipolnenieParams: 'naryad-column-sizing:vipolnenie-params',
}

const TABLE_SIZING_PREFIX = 'table-column-sizing:'

export function tableColumnSizingUrlKey(url) {
  return `${TABLE_SIZING_PREFIX}${url}`
}

function readStorage(key) {
  try {
    return localStorage.getItem(key)
  } catch {
    return null
  }
}

function writeStorage(key, value) {
  try {
    localStorage.setItem(key, value)
  } catch {
    // private mode / недоступен storage
  }
}

function parsePositiveWidth(raw) {
  const parsed = Number(raw)
  return Number.isFinite(parsed) && parsed > 0 ? parsed : null
}

export function readStoredRightPanelWidth(storageKey = RIGHT_PANEL_WIDTH_KEY) {
  return (
    parsePositiveWidth(readStorage(storageKey))
    ?? parsePositiveWidth(readStorage(RIGHT_PANEL_WIDTH_KEY))
  )
}

export function writeStoredRightPanelWidth(width, storageKey = RIGHT_PANEL_WIDTH_KEY) {
  if (!(Number.isFinite(width) && width > 0)) return
  writeStorage(storageKey, String(Math.round(width)))
}

export function clampRightPanelWidth(width, containerWidth) {
  if (!(containerWidth > 0)) {
    return Number.isFinite(width) && width > 0 ? Math.round(width) : RIGHT_PANEL_MIN
  }
  const maxRight = Math.floor(containerWidth * RIGHT_PANEL_MAX_RATIO)
  const maxByLeft = containerWidth - LEFT_PANEL_MIN
  const upper = Math.max(RIGHT_PANEL_MIN, Math.min(maxRight, maxByLeft))
  return Math.min(Math.max(Math.round(width), RIGHT_PANEL_MIN), upper)
}

function readSizingMap(key) {
  const raw = readStorage(key)
  if (!raw) return null
  try {
    const parsed = JSON.parse(raw)
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) return null
    return parsed
  } catch {
    return null
  }
}

function hasColumnSizes(sizing) {
  return Boolean(sizing && Object.keys(sizing).length > 0)
}

/**
 * До монтирования BaseTable/BaseTreeTable кладём стабильную раскладку
 * в ключ пакета `table-column-sizing:${url}`.
 */
export function seedTableColumnSizing(url, stableKey) {
  if (!url || !stableKey) return
  const urlKey = tableColumnSizingUrlKey(url)
  const stable = readSizingMap(stableKey)
  const perUrl = readSizingMap(urlKey)
  if (hasColumnSizes(stable)) {
    writeStorage(urlKey, JSON.stringify(stable))
    return
  }
  if (hasColumnSizes(perUrl)) {
    writeStorage(stableKey, JSON.stringify(perUrl))
  }
}

/** После ресайза копируем ключ пакета в стабильный, пустой {} не затирает раскладку. */
export function persistTableColumnSizing(url, stableKey) {
  if (!url || !stableKey) return
  const perUrl = readSizingMap(tableColumnSizingUrlKey(url))
  if (!hasColumnSizes(perUrl)) return
  writeStorage(stableKey, JSON.stringify(perUrl))
}
