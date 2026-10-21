import { useCallback, useRef, useState } from 'react'
import { SKV_DIALOG_HEIGHT_RATIO, SKV_DIALOG_WIDTH } from './SkvParamsDialog.jsx'
import { sideBySidePosition } from './skvRules.js'
import {
  activateSkvWindow,
  closeSkvWindow,
  openSkvWindow,
  skvOpenerId,
} from './skvWindows.js'

/** Отступы Paper окна от краёв экрана (m: 2). */
const VIEWPORT_MARGIN = 32

/**
 * Окна сквозных параметров карточки. Живут на уровне страницы: окно выполнения
 * открывается из окна задания, даже если вкладка выполнения скрыта.
 */
export default function useSkvWindows() {
  const [windows, setWindows] = useState([])
  const papers = useRef({})

  const open = useCallback((partId, besideOf = null) => {
    setWindows((prev) => {
      if (prev.some((item) => item.partId === partId)) {
        return activateSkvWindow(prev, partId)
      }
      const openerId = skvOpenerId(prev, partId, besideOf)
      const openerRect = openerId ? papers.current[openerId]?.getBoundingClientRect() : null
      const viewportWidth = window.innerWidth
      const viewportHeight = window.innerHeight
      const position = sideBySidePosition({
        openerRect,
        width: Math.min(SKV_DIALOG_WIDTH, viewportWidth - VIEWPORT_MARGIN),
        height: viewportHeight * SKV_DIALOG_HEIGHT_RATIO,
        viewportWidth,
        viewportHeight,
      })
      return openSkvWindow(prev, partId, position)
    })
  }, [])

  const close = useCallback((partId) => {
    setWindows((prev) => closeSkvWindow(prev, partId))
  }, [])

  const activate = useCallback((partId) => {
    setWindows((prev) => activateSkvWindow(prev, partId))
  }, [])

  const closeAll = useCallback(() => setWindows([]), [])

  const paperRef = useCallback((partId) => (node) => {
    if (node) {
      papers.current[partId] = node
    } else {
      delete papers.current[partId]
    }
  }, [])

  return { windows, open, close, activate, closeAll, paperRef }
}
