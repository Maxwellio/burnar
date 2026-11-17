import { useEffect, useRef, useState } from 'react'
import {
  SPLIT_DEFAULT_RATIO,
  clampSplitRatio,
  readStoredSplitRatio,
  writeStoredSplitRatio,
} from '../../naryadPageLayout.js'

/**
 * Доля задания в паре с выполнением. Тянется сплиттером и пишется в
 * localStorage только когда жест закончен. ResizeObserver поджимает показ
 * и не затирает сохранённую долю.
 *
 * orientation: vertical — половины слева и справа, horizontal — сверху и снизу.
 */
export default function useResizableSplit(orientation) {
  const containerRef = useRef(null)
  const preferredRef = useRef(readStoredSplitRatio() ?? SPLIT_DEFAULT_RATIO)
  const orientationRef = useRef(orientation)
  orientationRef.current = orientation
  const [ratio, setRatio] = useState(() => preferredRef.current)
  const [dragging, setDragging] = useState(false)

  useEffect(() => {
    const el = containerRef.current
    if (!el) return undefined
    const sync = () => {
      const size = orientationRef.current === 'horizontal' ? el.clientHeight : el.clientWidth
      setRatio(clampSplitRatio(preferredRef.current, size))
    }
    sync()
    const observer = new ResizeObserver(sync)
    observer.observe(el)
    return () => observer.disconnect()
  }, [orientation])

  useEffect(() => {
    if (!dragging) return undefined
    const horizontal = orientationRef.current === 'horizontal'
    const prevCursor = document.body.style.cursor
    const prevSelect = document.body.style.userSelect
    document.body.style.cursor = horizontal ? 'row-resize' : 'col-resize'
    document.body.style.userSelect = 'none'

    const onMove = (event) => {
      const el = containerRef.current
      if (!el) return
      const rect = el.getBoundingClientRect()
      const size = horizontal ? rect.height : rect.width
      const offset = horizontal ? event.clientY - rect.top : event.clientX - rect.left
      if (!(size > 0)) return
      const next = clampSplitRatio(offset / size, size)
      preferredRef.current = next
      setRatio(next)
    }
    const onUp = () => {
      setDragging(false)
      writeStoredSplitRatio(preferredRef.current)
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

  const onSplitterPointerDown = (event) => {
    if (event.button !== 0) return
    event.preventDefault()
    setDragging(true)
  }

  return { containerRef, ratio, dragging, onSplitterPointerDown }
}
