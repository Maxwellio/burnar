import Dialog from '@mui/material/Dialog'
import DialogTitle from '@mui/material/DialogTitle'
import { Children, cloneElement, isValidElement, useRef } from 'react'
import { useDraggableDialog } from '../hooks/useDraggableDialog'

const DRAGGABLE_TITLE_ID = 'draggable-dialog-title'

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
 */
function DraggableDialog({ open, children, PaperProps, ...rest }) {
  const paperRef = useRef(null)
  const { position, handleMouseDown } = useDraggableDialog(open, paperRef)

  let titleEnhanced = false
  const enhancedChildren = Children.map(children, (child) => {
    if (!titleEnhanced && isDialogTitle(child)) {
      titleEnhanced = true
      const { sx, onMouseDown, id, ...titleProps } = child.props
      return cloneElement(child, {
        ...titleProps,
        id: id || DRAGGABLE_TITLE_ID,
        sx: { cursor: 'move', userSelect: 'none', ...sx },
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
    style: {
      ...PaperProps?.style,
      transform: `translate(${position.x}px, ${position.y}px)`,
    },
  }

  return (
    <Dialog
      open={open}
      {...rest}
      aria-labelledby={rest['aria-labelledby'] || DRAGGABLE_TITLE_ID}
      PaperProps={mergedPaperProps}
    >
      {enhancedChildren}
    </Dialog>
  )
}

export default DraggableDialog
