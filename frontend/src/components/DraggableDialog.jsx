import Dialog from '@mui/material/Dialog'
import DialogTitle from '@mui/material/DialogTitle'
import { Children, cloneElement, isValidElement, useRef } from 'react'
import { useDraggableDialog } from '../hooks/useDraggableDialog'

const DRAGGABLE_TITLE_ID = 'draggable-dialog-title'

/**
 * Окно без своей подложки и ловушки фокуса: корень Modal на весь экран
 * пропускает клики, их принимает только Paper. Так можно работать с
 * несколькими такими окнами одновременно; страницу закрывает общая подложка.
 */
const MODELESS_PROPS = {
  hideBackdrop: true,
  disableEnforceFocus: true,
  disableAutoFocus: true,
  disableScrollLock: true,
}

const modelessRootSx = {
  pointerEvents: 'none',
  '& .MuiDialog-container': { pointerEvents: 'none' },
}

function isDialogTitle(child) {
  return isValidElement(child) && (child.type === DialogTitle || child.type?.muiName === 'DialogTitle')
}

function mergeRef(ref, node) {
  if (typeof ref === 'function') {
    ref(node)
  } else if (ref) {
    ref.current = node
  }
}

/**
 * MUI Dialog с перетаскиванием за DialogTitle (без react-draggable).
 * Заголовок — первый child DialogTitle; onClose и прочее — через ...rest.
 * Скопировано из substitute Work_redone для форм ответственных лиц и confirm.
 *
 * Необязательно: modeless (см. MODELESS_PROPS), initialPosition — смещение
 * от центра при открытии, zIndex, onActivate — нажатие внутри окна.
 */
function DraggableDialog({
  open,
  children,
  PaperProps,
  modeless = false,
  initialPosition,
  zIndex,
  onActivate,
  sx,
  ...rest
}) {
  const paperRef = useRef(null)
  const { position, handleMouseDown } = useDraggableDialog(open, paperRef, initialPosition)

  let titleEnhanced = false
  const enhancedChildren = Children.map(children, (child) => {
    if (!titleEnhanced && isDialogTitle(child)) {
      titleEnhanced = true
      const { sx: titleSx, onMouseDown, id, ...titleProps } = child.props
      return cloneElement(child, {
        ...titleProps,
        id: id || DRAGGABLE_TITLE_ID,
        sx: { cursor: 'move', userSelect: 'none', ...titleSx },
        onMouseDown: (event) => {
          handleMouseDown(event)
          onMouseDown?.(event)
        },
      })
    }
    return child
  })

  const mergedPaperProps = {
    ...PaperProps,
    ref: (node) => {
      paperRef.current = node
      mergeRef(PaperProps?.ref, node)
    },
    onMouseDownCapture: (event) => {
      onActivate?.()
      PaperProps?.onMouseDownCapture?.(event)
    },
    style: {
      ...PaperProps?.style,
      ...(modeless ? { pointerEvents: 'auto' } : null),
      transform: `translate(${position.x}px, ${position.y}px)`,
    },
  }

  const rootSx = [
    modeless ? modelessRootSx : null,
    zIndex == null ? null : { zIndex },
    ...(Array.isArray(sx) ? sx : [sx]),
  ].filter(Boolean)

  return (
    <Dialog
      open={open}
      {...(modeless ? MODELESS_PROPS : null)}
      {...rest}
      sx={rootSx}
      aria-labelledby={rest['aria-labelledby'] || DRAGGABLE_TITLE_ID}
      PaperProps={mergedPaperProps}
    >
      {enhancedChildren}
    </Dialog>
  )
}

export default DraggableDialog
