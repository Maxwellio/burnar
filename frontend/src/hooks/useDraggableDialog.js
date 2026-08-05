import { useCallback, useEffect, useRef, useState } from 'react'

const INTERACTIVE_SELECTOR = 'button, a, input, textarea, select, [role="button"]'

/** Не даём утащить диалог за край viewport (минимум 48px видимости). */
function clampPosition(nextX, nextY, paperEl, currentX, currentY) {
  if (!paperEl) return { x: nextX, y: nextY }

  const rect = paperEl.getBoundingClientRect()
  const dx = nextX - currentX
  const dy = nextY - currentY
  const minVisible = 48

  let adjustX = 0
  let adjustY = 0

  const newLeft = rect.left + dx
  const newRight = rect.right + dx
  const newTop = rect.top + dy
  const newBottom = rect.bottom + dy

  if (newLeft < minVisible - rect.width) {
    adjustX = minVisible - rect.width - newLeft
  } else if (newRight < minVisible) {
    adjustX = minVisible - newRight
  }

  if (newTop < 0) {
    adjustY = -newTop
  } else if (newBottom < minVisible) {
    adjustY = minVisible - newBottom
  }

  return { x: nextX + adjustX, y: nextY + adjustY }
}

/** Drag-состояние для DraggableDialog: сброс позиции при close. */
export function useDraggableDialog(open, paperRef) {
  const [position, setPosition] = useState({ x: 0, y: 0 })
  const positionRef = useRef(position)
  const dragState = useRef(null)

  positionRef.current = position

  useEffect(() => {
    if (!open) {
      setPosition({ x: 0, y: 0 })
    }
  }, [open])

  const handleMouseDown = useCallback((event) => {
    if (event.button !== 0) return
    if (event.target.closest(INTERACTIVE_SELECTOR)) return

    event.preventDefault()

    dragState.current = {
      startX: event.clientX,
      startY: event.clientY,
      origX: positionRef.current.x,
      origY: positionRef.current.y,
    }

    document.body.style.userSelect = 'none'
    document.body.style.cursor = 'move'
  }, [])

  useEffect(() => {
    const handleMouseMove = (event) => {
      if (!dragState.current) return

      const nextX = dragState.current.origX + event.clientX - dragState.current.startX
      const nextY = dragState.current.origY + event.clientY - dragState.current.startY
      const paperEl = paperRef.current
      setPosition(clampPosition(nextX, nextY, paperEl, positionRef.current.x, positionRef.current.y))
    }

    const handleMouseUp = () => {
      if (!dragState.current) return
      dragState.current = null
      document.body.style.userSelect = ''
      document.body.style.cursor = ''
    }

    document.addEventListener('mousemove', handleMouseMove)
    document.addEventListener('mouseup', handleMouseUp)

    return () => {
      document.removeEventListener('mousemove', handleMouseMove)
      document.removeEventListener('mouseup', handleMouseUp)
      document.body.style.userSelect = ''
      document.body.style.cursor = ''
    }
  }, [paperRef])

  return { position, handleMouseDown }
}
