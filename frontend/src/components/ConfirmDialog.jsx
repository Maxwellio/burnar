import DraggableDialog from './DraggableDialog'
import DialogTitle from '@mui/material/DialogTitle'
import DialogContent from '@mui/material/DialogContent'
import DialogActions from '@mui/material/DialogActions'
import Button from '@mui/material/Button'
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
  onConfirm,
  onCancel,
}) {
  const hasCancel = Boolean(cancelLabel)
  return (
    <DraggableDialog open={open} onClose={onCancel} maxWidth="xs" fullWidth>
      <DialogTitle>{title}</DialogTitle>
      <DialogContent dividers>
        <Typography variant="body1">{message}</Typography>
      </DialogContent>
      <DialogActions sx={{ px: 3, py: 2 }}>
        {hasCancel ? (
          <Button variant="outlined" color="inherit" onClick={onCancel}>
            {cancelLabel}
          </Button>
        ) : null}
        <Button variant="contained" color={confirmColor} onClick={onConfirm} autoFocus>
          {confirmLabel}
        </Button>
      </DialogActions>
    </DraggableDialog>
  )
}

export default ConfirmDialog
