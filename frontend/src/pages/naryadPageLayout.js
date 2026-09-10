/** Высота action bar карточки наряда — как Toolbar в ProtectedLayout (minHeight 48). */
export const ACTION_BAR_HEIGHT = 48

/** Ширина правой панели параметров+алгоритм (px), общая для задания и выполнения. */
export const RIGHT_PANEL_WIDTH_KEY = 'naryad-right-panel-width'
export const RIGHT_PANEL_DEFAULT_RATIO = 0.25
export const RIGHT_PANEL_MIN = 180
export const LEFT_PANEL_MIN = 360
export const RIGHT_PANEL_MAX_RATIO = 0.5

export function readStoredRightPanelWidth() {
  try {
    const parsed = Number(localStorage.getItem(RIGHT_PANEL_WIDTH_KEY))
    if (Number.isFinite(parsed) && parsed > 0) return parsed
  } catch {
    // private mode / недоступен storage
  }
  return null
}

export function writeStoredRightPanelWidth(width) {
  try {
    localStorage.setItem(RIGHT_PANEL_WIDTH_KEY, String(width))
  } catch {
    // private mode / недоступен storage
  }
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
