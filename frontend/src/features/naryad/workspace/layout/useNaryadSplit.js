import { useCallback, useEffect, useRef, useState } from 'react'
import {
  SPLITTER_THICKNESS,
  SPLIT_RATIO_DEFAULT,
  clampSplitFirstPane,
  readStoredSplitRatio,
  writeStoredSplitRatio,
} from '../../naryadPageLayout.js'

/**
 * Доля задания среди двух открытых половин. Тянется сплиттером и пишется
 * в localStorage только когда жест закончен. Сжатие окна поджимает показ
 * и записанную долю не затирает. Двойной щелчок возвращает половину.
 */
export default function useNaryadSplit(orientation) {
  const containerRef = useRef(null)
  const dragRef = useRef(null)
  const orientationRef = useRef(orientation)
  const preferredRef = useRef(readStoredSplitRatio(orientation))
  const [firstSize, setFirstSize] = useState(null)
  const [dragging, setDragging] = useState(false)
  orientationRef.current = orientation

  const containerSize = () => {
    const el = containerRef.current
    if (!el) return 0
    return orientationRef.current === 'horizontal' ? el.clientHeight : el.clientWidth
  }

  const measure = useCallback(() => {
    setFirstSize(clampSplitFirstPane(preferredRef.current, containerSize(), SPLITTER_THICKNESS))
  }, [])

  useEffect(() => {
    preferredRef.current = readStoredSplitRatio(orientation)
    measure()
  }, [orientation, measure])

  useEffect(() => {
    const el = containerRef.current
    if (!el) return undefined
    measure()
    const observer = new ResizeObserver(measure)
    observer.observe(el)
    return () => observer.disconnect()
  }, [measure])

  useEffect(() => {
    if (!dragging) return undefined
    const horizontal = orientationRef.current === 'horizontal'
    const prevCursor = document.body.style.cursor
    const prevSelect = document.body.style.userSelect
    document.body.style.cursor = horizontal ? 'row-resize' : 'col-resize'
    document.body.style.userSelect = 'none'

    const onMove = (event) => {
      const drag = dragRef.current
      if (!drag) return
      const point = horizontal ? event.clientY : event.clientX
      const available = containerSize() - SPLITTER_THICKNESS
      if (!(available > 0)) return
      const clamped = clampSplitFirstPane(
        (drag.startSize + (point - drag.start)) / available,
        containerSize(),
        SPLITTER_THICKNESS,
      )
      if (clamped == null) return
      preferredRef.current = clamped / available
      setFirstSize(clamped)
    }
    const onUp = () => {
      dragRef.current = null
      setDragging(false)
      writeStoredSplitRatio(orientationRef.current, preferredRef.current)
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
    if (event.button !== 0 || firstSize == null) return
    event.preventDefault()
    const horizontal = orientationRef.current === 'horizontal'
    dragRef.current = {
      start: horizontal ? event.clientY : event.clientX,
      startSize: firstSize,
    }
    setDragging(true)
  }

  const reset = () => {
    preferredRef.current = SPLIT_RATIO_DEFAULT
    writeStoredSplitRatio(orientationRef.current, SPLIT_RATIO_DEFAULT)
    measure()
  }

  return { containerRef, firstSize, dragging, onPointerDown, reset }
}
