import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { tableColumnSizingUrlKey } from '../naryadPageLayout.js'
import {
  SKV_COLUMN_MIN,
  applyColumnWidths,
  fitColumnSizes,
  readColumnSizes,
  resizeColumn,
  sameColumnSizes,
} from './skvColumnLayout.js'

function readSavedSizes(url) {
  try {
    const raw = localStorage.getItem(tableColumnSizingUrlKey(url))
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}

function writeSavedSizes(url, sizes) {
  try {
    localStorage.setItem(tableColumnSizingUrlKey(url), JSON.stringify(sizes))
  } catch {
    // private mode / недоступен storage
  }
}

function measureTableWidth(root) {
  const scroller = root.querySelector('.overflow-y-auto')
  const width = scroller?.clientWidth || root.clientWidth || 0
  return width > 0 ? width : 0
}

function pointerX(event) {
  return event.touches?.[0]?.clientX
    ?? event.changedTouches?.[0]?.clientX
    ?? event.clientX
}

/**
 * Ширины BaseTable на главной живут в пикселях и при росте колонки увеличивают
 * таблицу. В окне сквозных параметров та же таблица должна оставаться в границах
 * формы: доля колонки меняется, сумма всегда равна ширине прокрутки.
 * Текст при этом переносится стилями окна, а не обрезается.
 */
export default function useSkvFittedColumns(containerRef, url, columns, active) {
  const order = columns.map((column) => column.id)
  const orderKey = order.join('|')
  const [sizes, setSizes] = useState(() => readColumnSizes(columns, readSavedSizes(url)))
  const sizesRef = useRef(sizes)
  sizesRef.current = sizes
  const orderRef = useRef(order)
  orderRef.current = order
  const widthRef = useRef(0)
  const dragRef = useRef(null)
  const dragStopRef = useRef(() => {})

  useLayoutEffect(() => {
    if (!active) return undefined
    const root = containerRef.current
    if (!root) return undefined

    const apply = () => {
      const width = measureTableWidth(root)
      if (!(width > 0)) return
      let next = sizesRef.current
      if (!dragRef.current && width !== widthRef.current) {
        next = fitColumnSizes(next, orderRef.current, width, SKV_COLUMN_MIN)
        widthRef.current = width
        if (!sameColumnSizes(next, sizesRef.current)) {
          sizesRef.current = next
          setSizes(next)
        }
      }
      applyColumnWidths(root, orderRef.current, next)
    }

    apply()
    const observer = new MutationObserver(apply)
    observer.observe(root, {
      subtree: true,
      childList: true,
      attributes: true,
      attributeFilter: ['style'],
    })
    const resizeObserver = new ResizeObserver(apply)
    resizeObserver.observe(root)
    const scroller = root.querySelector('.overflow-y-auto')
    if (scroller) resizeObserver.observe(scroller)
    return () => {
      observer.disconnect()
      resizeObserver.disconnect()
    }
  }, [active, containerRef, orderKey])

  useEffect(() => {
    if (!active) return undefined
    const root = containerRef.current
    if (!root) return undefined

    const onDown = (event) => {
      const handle = event.target?.closest?.('.cursor-col-resize')
      if (!handle || !root.contains(handle)) return
      const header = handle.closest('th')
      if (!header?.parentElement) return
      const index = [...header.parentElement.children].indexOf(header)
      const id = orderRef.current[index]
      if (!id) return
      event.preventDefault()
      event.stopPropagation()

      const startX = pointerX(event)
      const startSizes = { ...sizesRef.current }
      const startSize = startSizes[id]
      dragRef.current = id
      const previousCursor = document.body.style.cursor
      const previousSelect = document.body.style.userSelect
      document.body.style.cursor = 'col-resize'
      document.body.style.userSelect = 'none'

      const move = (moveEvent) => {
        const width = measureTableWidth(root) || widthRef.current
        const next = resizeColumn(
          startSizes,
          orderRef.current,
          id,
          startSize + (pointerX(moveEvent) - startX),
          width,
          SKV_COLUMN_MIN,
        )
        sizesRef.current = next
        setSizes(next)
        // До pointerup, чтобы общая раскладка наряда успела скопировать новые доли.
        writeSavedSizes(url, next)
        applyColumnWidths(root, orderRef.current, next)
        moveEvent.preventDefault()
      }
      const end = () => {
        dragStopRef.current = () => {}
        dragRef.current = null
        document.body.style.cursor = previousCursor
        document.body.style.userSelect = previousSelect
        window.removeEventListener('mousemove', move)
        window.removeEventListener('mouseup', end)
        window.removeEventListener('touchmove', move)
        window.removeEventListener('touchend', end)
      }
      dragStopRef.current = end
      window.addEventListener('mousemove', move)
      window.addEventListener('mouseup', end)
      window.addEventListener('touchmove', move, { passive: false })
      window.addEventListener('touchend', end)
    }

    root.addEventListener('mousedown', onDown, true)
    root.addEventListener('touchstart', onDown, true)
    return () => {
      dragStopRef.current()
      root.removeEventListener('mousedown', onDown, true)
      root.removeEventListener('touchstart', onDown, true)
    }
  }, [active, containerRef, orderKey, url])
}
