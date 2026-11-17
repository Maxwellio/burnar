/** Высота action bar карточки наряда — как Toolbar в ProtectedLayout (minHeight 48). */
export const ACTION_BAR_HEIGHT = 48

/**
 * Вертикальные поля ячеек дерева и параметров.
 * BaseTreeTable/BaseTable ставят Tailwind py-2 (8px сверху и снизу).
 */
export const NARYAD_CELL_PADDING_Y = '2px'

/** Плотнее строки только на карточке наряда, без смены общего пакета таблиц. */
export const naryadCompactTableSx = {
  '& th, & td': {
    paddingTop: NARYAD_CELL_PADDING_Y,
    paddingBottom: NARYAD_CELL_PADDING_Y,
    lineHeight: 1.15,
  },
}

/** Вертикальное или горизонтальное деление задания и выполнения. */
export const SPLIT_ORIENTATION_KEY = 'naryad-split-orientation'

/** Доля первой половины (задание). 0.5 — поровну. */
export const SPLIT_RATIO_KEY = 'naryad-split-ratio'
export const SPLIT_DEFAULT_RATIO = 0.5
/** Ни одна половина не становится уже/ниже этого, пока контейнер позволяет. */
export const SPLIT_PANE_MIN = 240
/** Толщина полосы между заданием и выполнением, как у PanelSplitter. */
export const SPLITTER_SIZE = 6

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
  vipolneniePeriodTotals: 'naryad-column-sizing:vipolnenie-period-totals',
  vipolneniePeriods: 'naryad-column-sizing:vipolnenie-periods',
  vipolnenieIntervalsMehbur: 'naryad-column-sizing:vipolnenie-intervals-mehbur',
  vipolnenieIntervalsNar: 'naryad-column-sizing:vipolnenie-intervals-nar',
  skvZadanie: 'naryad-column-sizing:skv-zadanie',
  skvVipolnenie: 'naryad-column-sizing:skv-vipolnenie',
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

export function readStoredSplitOrientation() {
  return readStorage(SPLIT_ORIENTATION_KEY) === 'horizontal' ? 'horizontal' : 'vertical'
}

export function writeStoredSplitOrientation(orientation) {
  if (orientation !== 'horizontal' && orientation !== 'vertical') return
  writeStorage(SPLIT_ORIENTATION_KEY, orientation)
}

function parseSplitRatio(raw) {
  const parsed = Number(raw)
  return Number.isFinite(parsed) && parsed > 0 && parsed < 1 ? parsed : null
}

export function readStoredSplitRatio() {
  return parseSplitRatio(readStorage(SPLIT_RATIO_KEY))
}

export function writeStoredSplitRatio(ratio) {
  const parsed = parseSplitRatio(ratio)
  if (parsed == null) return
  const rounded = Math.round(parsed * 10000) / 10000
  if (!(rounded > 0 && rounded < 1)) return
  writeStorage(SPLIT_RATIO_KEY, String(rounded))
}

/**
 * Доля первой половины. При неизвестной ширине контейнера доля не зажимается:
 * ResizeObserver поджимает только показ и не затирает сохранённое значение.
 */
export function clampSplitRatio(ratio, containerSize) {
  const raw = parseSplitRatio(ratio) ?? SPLIT_DEFAULT_RATIO
  if (!(containerSize > 0)) return raw
  const minRatio = Math.min(SPLIT_DEFAULT_RATIO, SPLIT_PANE_MIN / containerSize)
  const maxRatio = 1 - minRatio
  return Math.min(Math.max(raw, minRatio), maxRatio)
}

/** flex первой половины: остаток после полосы сплиттера, умноженный на долю. */
export function firstPaneFlex(ratio) {
  const share = clampSplitRatio(ratio, 0)
  return `0 0 calc((100% - ${SPLITTER_SIZE}px) * ${share})`
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
