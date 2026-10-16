import { useCallback, useEffect, useRef, useState } from 'react'
import {
  RIGHT_PANEL_DEFAULT_RATIO,
  clampRightPanelWidth,
  readStoredRightPanelWidth,
  writeStoredRightPanelWidth,
} from '../../naryadPageLayout.js'

/**
 * Ширина правой панели вкладки: тянется сплиттером и пишется в localStorage.
 * В storage уходит только значение после drag. ResizeObserver лишь поджимает
 * отображение, чтобы сплит 50/50 не затирал сохранённую ширину.
 */
export default function useResizablePanel(storageKey) {
  const containerRef = useRef(null)
  const dragRef = useRef(null)
  const [storedWidth] = useState(() => readStoredRightPanelWidth(storageKey))
  const preferredWidthRef = useRef(storedWidth)
  const [width, setWidth] = useState(storedWidth)
  const [dragging, setDragging] = useState(false)

  const applyWidth = useCallback((next) => {
    const containerWidth = containerRef.current?.clientWidth ?? 0
    if (!(containerWidth > 0)) return
    const clamped = clampRightPanelWidth(next, containerWidth)
    preferredWidthRef.current = clamped
    setWidth(clamped)
    writeStoredRightPanelWidth(clamped, storageKey)
  }, [storageKey])

  useEffect(() => {
    const el = containerRef.current
    if (!el) return undefined

    const sync = () => {
      const cw = el.clientWidth
      if (!(cw > 0)) return
      setWidth(() => {
        const raw = preferredWidthRef.current ?? Math.round(cw * RIGHT_PANEL_DEFAULT_RATIO)
        return clampRightPanelWidth(raw, cw)
      })
    }

    sync()
    const observer = new ResizeObserver(sync)
    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  useEffect(() => {
    if (!dragging) return undefined
    const prevCursor = document.body.style.cursor
    const prevSelect = document.body.style.userSelect
    document.body.style.cursor = 'col-resize'
    document.body.style.userSelect = 'none'

    const onMove = (event) => {
      const drag = dragRef.current
      if (!drag) return
      applyWidth(drag.startWidth - (event.clientX - drag.startX))
    }
    const onUp = () => {
      dragRef.current = null
      setDragging(false)
    }

    window.addEventListener('pointermove', onMove)
    window.addEventListener('pointerup', onUp)
    return () => {
      window.removeEventListener('pointermove', onMove)
      window.removeEventListener('pointerup', onUp)
      document.body.style.cursor = prevCursor
      document.body.style.userSelect = prevSelect
    }
  }, [dragging, applyWidth])

  const onSplitterPointerDown = (event) => {
    if (event.button !== 0) return
    event.preventDefault()
    dragRef.current = {
      startX: event.clientX,
      startWidth: width ?? 0,
    }
    setDragging(true)
  }

  return { containerRef, width, dragging, onSplitterPointerDown }
}
