import { useEffect, useState } from 'react'
import DraggableDialog from './DraggableDialog'
import DialogTitle from '@mui/material/DialogTitle'
import DialogContent from '@mui/material/DialogContent'
import DialogActions from '@mui/material/DialogActions'
import Button from '@mui/material/Button'
import TextField from '@mui/material/TextField'
import Typography from '@mui/material/Typography'

/**
 * Универсальный confirm/предупреждение на DraggableDialog.
 * Обычно не вызывается напрямую — через ConfirmProvider / useConfirm / useAlert.
 */
function ConfirmDialog({
  open,
  title,
  message,
  confirmLabel = 'Удалить',
  cancelLabel = 'Отмена',
  confirmColor = 'error',
  alternateLabel = null,
  choices = null,
  input = null,
  onConfirm,
  onAlternate,
  onChoice,
  onCancel,
}) {
  const [draft, setDraft] = useState(input?.defaultValue ?? '')
  useEffect(() => {
    if (open) setDraft(input?.defaultValue ?? '')
  }, [open, input?.defaultValue])

  const hasCancel = Boolean(cancelLabel)
  return (
    <DraggableDialog open={open} onClose={onCancel} maxWidth="xs" fullWidth>
      <DialogTitle>{title}</DialogTitle>
      <DialogContent dividers>
        {input ? (
          <TextField
            autoFocus
            fullWidth
            margin="dense"
            label={message || 'Название'}
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === 'Enter' && !choices?.length) {
                event.preventDefault()
                onConfirm(draft)
              }
            }}
          />
        ) : (
          <Typography variant="body1" sx={{ whiteSpace: 'pre-line' }}>{message}</Typography>
        )}
      </DialogContent>
      <DialogActions sx={{ px: 3, py: 2 }}>
        {hasCancel ? (
          <Button type="button" variant="outlined" color="inherit" onClick={onCancel}>
            {cancelLabel}
          </Button>
        ) : null}
        {choices?.length ? choices.map((choice) => (
          <Button
            key={choice.result}
            type="button"
            variant="outlined"
            data-place={choice.result}
            onClick={(event) => {
              event.preventDefault()
              event.stopPropagation()
              onChoice(event.currentTarget.getAttribute('data-place'), draft)
            }}
          >
            {choice.label}
          </Button>
        )) : (
          <>
            {alternateLabel ? (
              <Button variant="outlined" onClick={onAlternate}>
                {alternateLabel}
              </Button>
            ) : null}
            <Button
              variant="contained"
              color={confirmColor}
              onClick={() => onConfirm(draft)}
              autoFocus={!input}
            >
              {confirmLabel}
            </Button>
          </>
        )}
      </DialogActions>
    </DraggableDialog>
  )
}

export default ConfirmDialog
