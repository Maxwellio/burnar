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
  createResponsiblePerson,
  fetchOrgTree,
  fetchPositions,
  fetchResponsiblePerson,
  updateResponsiblePerson,
} from '../api/responsiblePersonsApi.js'

const emptyForm = () => ({
  fio: '',
  fioreports: '',
  fiorodpad: '',
  tabn: '',
  dateIn: format(new Date(), 'yyyy-MM-dd'),
  orgId: '',
  doljId: '',
})

/**
 * Модалка add/edit ответственного лица (Delphi formPeopleAdd) в DraggableDialog.
 * Edit скрывает дату/должность/подразделение — первая карьера правится справа позже.
 */
export default function PeopleFormDialog({
  open,
  mode,
  peopleId,
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
    if (!open) return undefined

    let cancelled = false
    setError('')
    setSaving(false)

    const load = async () => {
      setLoading(true)
      try {
        if (isEdit) {
          const detail = await fetchResponsiblePerson(peopleId)
          if (cancelled) return
          setForm({
            ...emptyForm(),
            fio: detail.fio ?? '',
            fioreports: detail.fioreports ?? '',
            fiorodpad: detail.fiorodpad ?? '',
            tabn: detail.tabn ?? '',
          })
          setPositions([])
          setOrgTree([])
        } else {
          setForm(emptyForm())
          const [pos, orgs] = await Promise.all([fetchPositions(), fetchOrgTree()])
          if (cancelled) return
          setPositions(Array.isArray(pos) ? pos : [])
          setOrgTree(Array.isArray(orgs) ? orgs : [])
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
  }, [open, isEdit, peopleId])

  const setField = (key) => (event) => {
    setForm((prev) => ({ ...prev, [key]: event.target.value }))
  }

  const canSave = (() => {
    if (saving || loading) return false
    if (!form.fio.trim()) return false
    if (!isEdit) {
      if (!form.dateIn || form.orgId === '' || form.doljId === '') return false
    }
    return true
  })()

  const handleSave = async () => {
    if (!canSave) return
    setSaving(true)
    setError('')
    try {
      if (isEdit) {
        await updateResponsiblePerson(peopleId, {
          fio: form.fio.trim(),
          fioreports: form.fioreports.trim(),
          fiorodpad: form.fiorodpad.trim(),
          tabn: form.tabn.trim(),
        })
        onSaved?.({ id: peopleId })
      } else {
        const created = await createResponsiblePerson({
          fio: form.fio.trim(),
          fioreports: form.fioreports.trim(),
          fiorodpad: form.fiorodpad.trim(),
          tabn: form.tabn.trim(),
          dateIn: form.dateIn,
          orgId: Number(form.orgId),
          doljId: Number(form.doljId),
        })
        onSaved?.({ id: created.id })
      }
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
        {isEdit ? 'Редактирование ответственного лица' : 'Добавление ответственного лица'}
      </DialogTitle>
      <DialogContent dividers>
        {loading ? (
          <Typography variant="body2" color="text.secondary">
            Загрузка…
          </Typography>
        ) : (
          <Stack spacing={2} sx={{ pt: 0.5 }}>
            <TextField
              label="Полное ФИО"
              value={form.fio}
              onChange={setField('fio')}
              required
              fullWidth
              size="small"
            />
            <TextField
              label="Инициалы, фамилия"
              value={form.fioreports}
              onChange={setField('fioreports')}
              fullWidth
              size="small"
            />
            <TextField
              label="Инициалы, фамилия (в родительном падеже)"
              value={form.fiorodpad}
              onChange={setField('fiorodpad')}
              fullWidth
              size="small"
            />
            <TextField
              label="Табельный номер"
              value={form.tabn}
              onChange={setField('tabn')}
              fullWidth
              size="small"
            />
            {!isEdit && (
              <>
                <TextField
                  label="Дата начала выполнения работ"
                  type="date"
                  value={form.dateIn}
                  onChange={setField('dateIn')}
                  required
                  fullWidth
                  size="small"
                  InputLabelProps={{ shrink: true }}
                />
                <FormControl fullWidth size="small" required>
                  <InputLabel id="people-dolj-label">Должность</InputLabel>
                  <Select
                    labelId="people-dolj-label"
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
                  <InputLabel id="people-org-label">Подразделение</InputLabel>
                  <Select
                    labelId="people-org-label"
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
              </>
            )}
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
        <Button
          variant="contained"
          onClick={handleSave}
          disabled={!canSave}
        >
          {saving ? 'Сохранение…' : 'Сохранить'}
        </Button>
      </DialogActions>
    </DraggableDialog>
  )
}
