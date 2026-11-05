import { useEffect, useRef, useState } from 'react'
import {
  PERIOD_TOTALS_PANEL_HEIGHT,
  clampPeriodTotalsHeight,
  readStoredPeriodTotalsHeight,
  writeStoredPeriodTotalsHeight,
} from '../periodTotals.js'

/**
 * Высота блока итогов: тянется верхней полосой и пишется в localStorage
 * только когда жест закончен. Сжатие колонки поджимает показ и не затирает
 * запомненную высоту.
 */
export default function usePeriodTotalsHeight() {
  const anchorRef = useRef(null)
  const dragRef = useRef(null)
  const preferredRef = useRef(readStoredPeriodTotalsHeight() ?? PERIOD_TOTALS_PANEL_HEIGHT)
  const [height, setHeight] = useState(() => preferredRef.current)
  const [dragging, setDragging] = useState(false)

  const containerHeight = () => anchorRef.current?.parentElement?.clientHeight ?? 0

  useEffect(() => {
    const parent = anchorRef.current?.parentElement
    if (!parent) return undefined
    const sync = () => {
      setHeight(clampPeriodTotalsHeight(preferredRef.current, parent.clientHeight))
    }
    sync()
    const observer = new ResizeObserver(sync)
    observer.observe(parent)
    return () => observer.disconnect()
  }, [])

  useEffect(() => {
    if (!dragging) return undefined
    const prevCursor = document.body.style.cursor
    const prevSelect = document.body.style.userSelect
    document.body.style.cursor = 'row-resize'
    document.body.style.userSelect = 'none'

    const onMove = (event) => {
      const drag = dragRef.current
      if (!drag) return
      const next = drag.startHeight - (event.clientY - drag.startY)
      const clamped = clampPeriodTotalsHeight(next, containerHeight())
      preferredRef.current = clamped
      setHeight(clamped)
    }
    const onUp = () => {
      dragRef.current = null
      setDragging(false)
      writeStoredPeriodTotalsHeight(preferredRef.current)
    }

    window.addEventListener('pointermove', onMove)
    window.addEventListener('pointerup', onUp)
    return () => {
      window.removeEventListener('pointermove', onMove)
      window.removeEventListener('pointerup', onUp)
      document.body.style.cursor = prevCursor
      document.body.style.userSelect = prevSelect
    }
  }, [dragging])

  const onPointerDown = (event) => {
    if (event.button !== 0) return
    event.preventDefault()
    dragRef.current = {
      startY: event.clientY,
      startHeight: height,
    }
    setDragging(true)
  }

  return { anchorRef, height, dragging, onPointerDown }
}
