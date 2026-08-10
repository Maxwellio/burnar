import { useEffect, useState } from 'react'
import Button from '@mui/material/Button'
import DialogActions from '@mui/material/DialogActions'
import DialogContent from '@mui/material/DialogContent'
import DialogTitle from '@mui/material/DialogTitle'
import FormControl from '@mui/material/FormControl'
import InputLabel from '@mui/material/InputLabel'
import MenuItem from '@mui/material/MenuItem'
import Select from '@mui/material/Select'
import Stack from '@mui/material/Stack'
import TextField from '@mui/material/TextField'
import Typography from '@mui/material/Typography'
import { format } from 'date-fns'
import DraggableDialog from '../components/DraggableDialog'
import {
  createCareer,
  fetchCareer,
  fetchOrgTree,
  fetchPositions,
  updateCareer,
} from '../api/responsiblePersonsApi.js'

/** Дефолт dateOut как в people_add / Delphi «открытый» период. */
const DEFAULT_DATE_OUT = '2040-01-01'

const emptyForm = () => ({
  dateIn: format(new Date(), 'yyyy-MM-dd'),
  dateOut: DEFAULT_DATE_OUT,
  orgId: '',
  doljId: '',
})

/**
 * Модалка add/edit карьеры (Delphi frmNewEditCareer) в DraggableDialog.
 * Валидация как в Delphi: обязательны должность и подразделение; даты без взаимной проверки.
 * Add — всегда дефолтные даты и пустые org/dolj; edit — GET career.
 */
export default function CareerFormDialog({
  open,
  mode,
  peopleId,
  careerKey,
  onClose,
  onSaved,
}) {
  const isEdit = mode === 'edit'
  const [form, setForm] = useState(emptyForm)
  const [positions, setPositions] = useState([])
  const [orgTree, setOrgTree] = useState([])
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!open || peopleId == null) return undefined

    let cancelled = false
    // Сразу сбрасываем, чтобы после edit→add не мелькали старые значения
    setError('')
    setSaving(false)
    setForm(emptyForm())

    const load = async () => {
      setLoading(true)
      try {
        const [pos, orgs] = await Promise.all([fetchPositions(), fetchOrgTree()])
        if (cancelled) return
        setPositions(Array.isArray(pos) ? pos : [])
        setOrgTree(Array.isArray(orgs) ? orgs : [])

        if (isEdit && careerKey != null) {
          const detail = await fetchCareer(peopleId, careerKey)
          if (cancelled) return
          setForm({
            dateIn: detail.dtEnter ?? format(new Date(), 'yyyy-MM-dd'),
            dateOut: detail.dtOut ?? DEFAULT_DATE_OUT,
            orgId: detail.orgId != null ? String(detail.orgId) : '',
            doljId: detail.doljId != null ? String(detail.doljId) : '',
          })
        }
      } catch (e) {
        if (!cancelled) {
          setError(e?.message || 'Не удалось загрузить данные')
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    load()
    return () => {
      cancelled = true
    }
  }, [open, isEdit, peopleId, careerKey])

  const setField = (key) => (event) => {
    setForm((prev) => ({ ...prev, [key]: event.target.value }))
  }

  const canSave =
    !saving &&
    !loading &&
    form.orgId !== '' &&
    form.doljId !== '' &&
    Boolean(form.dateIn) &&
    Boolean(form.dateOut)

  const handleSave = async () => {
    if (!canSave) return
    setSaving(true)
    setError('')
    const body = {
      dateIn: form.dateIn,
      dateOut: form.dateOut,
      orgId: Number(form.orgId),
      doljId: Number(form.doljId),
    }
    try {
      if (isEdit) {
        await updateCareer(peopleId, careerKey, body)
      } else {
        await createCareer(peopleId, body)
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
        {isEdit ? 'Редактирование карьеры' : 'Добавление карьеры'}
      </DialogTitle>
      <DialogContent dividers>
        {loading ? (
          <Typography variant="body2" color="text.secondary">
            Загрузка…
          </Typography>
        ) : (
          <Stack spacing={2} sx={{ pt: 0.5 }}>
            <TextField
              label="Дата начала выполнения работ"
              type="date"
              value={form.dateIn}
              onChange={setField('dateIn')}
              fullWidth
              size="small"
              InputLabelProps={{ shrink: true }}
            />
            <TextField
              label="Дата окончания выполнения работ"
              type="date"
              value={form.dateOut}
              onChange={setField('dateOut')}
              fullWidth
              size="small"
              InputLabelProps={{ shrink: true }}
            />
            <FormControl fullWidth size="small" required>
              <InputLabel id="career-dolj-label">Должность</InputLabel>
              <Select
                labelId="career-dolj-label"
                label="Должность"
                value={form.doljId}
                onChange={setField('doljId')}
              >
                {positions.map((p) => (
                  <MenuItem key={p.id} value={String(p.id)}>
                    {p.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <FormControl fullWidth size="small" required>
              <InputLabel id="career-org-label">Подразделение</InputLabel>
              <Select
                labelId="career-org-label"
                label="Подразделение"
                value={form.orgId}
                onChange={setField('orgId')}
              >
                {orgTree.map((o) => (
                  <MenuItem key={o.id} value={String(o.id)}>
                    {o.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
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
