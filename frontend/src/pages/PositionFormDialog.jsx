import { useEffect, useState } from 'react'
import Button from '@mui/material/Button'
import DialogActions from '@mui/material/DialogActions'
import DialogContent from '@mui/material/DialogContent'
import DialogTitle from '@mui/material/DialogTitle'
import Stack from '@mui/material/Stack'
import TextField from '@mui/material/TextField'
import Typography from '@mui/material/Typography'
import DraggableDialog from '../components/DraggableDialog'
import { createPosition, fetchPosition, updatePosition } from '../api/adminPositionsApi.js'

const NM_MAX_LEN = 70

/**
 * Модалка add/edit должности (Delphi Sprdolj_IUD в дампе нет — только nm).
 * Edit грузит карточку GET /admin/positions/{id}; add — пустое имя.
 */
export default function PositionFormDialog({
  open,
  mode,
  positionId,
  onClose,
  onSaved,
}) {
  const isEdit = mode === 'edit'
  const [nm, setNm] = useState('')
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!open) return undefined

    let cancelled = false
    setError('')
    setSaving(false)
    setNm('')

    const load = async () => {
      if (!isEdit || positionId == null) {
        setLoading(false)
        return
      }
      setLoading(true)
      try {
        const detail = await fetchPosition(positionId)
        if (cancelled) return
        setNm(detail.nm ?? '')
      } catch (e) {
        if (!cancelled) {
          setError(e?.message || 'Не удалось загрузить должность')
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    load()
    return () => {
      cancelled = true
    }
  }, [open, isEdit, positionId])

  const trimmed = nm.trim()
  const canSave = !saving && !loading && trimmed !== '' && trimmed.length <= NM_MAX_LEN

  const handleSave = async () => {
    if (!canSave) return
    setSaving(true)
    setError('')
    const body = { nm: trimmed }
    try {
      if (isEdit) {
        await updatePosition(positionId, body)
      } else {
        await createPosition(body)
      }
      onSaved?.()
      onClose?.()
    } catch (e) {
      setError(e?.message || 'Ошибка сохранения')
    } finally {
      setSaving(false)
    }
  }

  return (
    <DraggableDialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>
        {isEdit ? 'Редактирование должности' : 'Добавление должности'}
      </DialogTitle>
      <DialogContent dividers>
        {loading ? (
          <Typography variant="body2" color="text.secondary">
            Загрузка…
          </Typography>
        ) : (
          <Stack spacing={2} sx={{ pt: 0.5 }}>
            <TextField
              label="Наименование"
              value={nm}
              onChange={(event) => setNm(event.target.value)}
              fullWidth
              size="small"
              required
              autoFocus
              inputProps={{ maxLength: NM_MAX_LEN }}
            />
            {error ? (
              <Typography variant="body2" color="error">
                {error}
              </Typography>
            ) : null}
          </Stack>
        )}
      </DialogContent>
      <DialogActions sx={{ px: 3, py: 2 }}>
        <Button variant="outlined" color="inherit" onClick={onClose} disabled={saving}>
          Отмена
        </Button>
        <Button variant="contained" onClick={handleSave} disabled={!canSave}>
          {saving ? 'Сохранение…' : 'Сохранить'}
        </Button>
      </DialogActions>
    </DraggableDialog>
  )
}
