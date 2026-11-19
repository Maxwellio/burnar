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
import { LocalizationProvider } from '@mui/x-date-pickers'
import { DesktopDateTimePicker } from '@mui/x-date-pickers/DesktopDateTimePicker'
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns'
import { ruRU } from '@mui/x-date-pickers/locales'
import { format, isValid, parseISO } from 'date-fns'
import { ru } from 'date-fns/locale'
import { createNaryad, fetchCreateBrigades } from '../api/naryadyApi.js'
import DraggableDialog from '../components/DraggableDialog'
import { buildCreatePayload, canCreateNaryad } from './createNaryadRules.js'

const clockSectionSx = {
  '& .MuiMultiSectionDigitalClockSection-root': {
    scrollbarWidth: 'none',
    msOverflowStyle: 'none',
    '&::-webkit-scrollbar': { display: 'none' },
    '&::after': { content: 'none', height: 0 },
  },
}

/**
 * Окно создания наряда: наименование, бригада, дата начала работ.
 * Бригада обязательна. Имя и дата уходят на сервер только если заполнены.
 */
export default function CreateNaryadDialog({ open, onClose, onCreated }) {
  const [name, setName] = useState('')
  const [brigadeId, setBrigadeId] = useState('')
  const [begDate, setBegDate] = useState(null)
  const [brigades, setBrigades] = useState([])
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!open) return undefined
    let cancelled = false
    setName('')
    setBrigadeId('')
    setBegDate(null)
    setError('')
    setSaving(false)
    setLoading(true)
    fetchCreateBrigades()
      .then((list) => {
        if (!cancelled) setBrigades(Array.isArray(list) ? list : [])
      })
      .catch((loadError) => {
        if (!cancelled) {
          setBrigades([])
          setError(loadError?.message || 'Не удалось загрузить бригады')
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [open])

  const ready = canCreateNaryad({ brigadeId, saving, loading })

  const handleCreate = async () => {
    if (!ready) return
    setSaving(true)
    setError('')
    try {
      const created = await createNaryad(buildCreatePayload({ name, brigadeId, begDate }))
      if (created?.id == null) {
        setError('Не удалось создать наряд')
        setSaving(false)
        return
      }
      onCreated?.(created.id)
    } catch (saveError) {
      setError(saveError?.message || 'Не удалось создать наряд')
      setSaving(false)
    }
  }

  return (
    <DraggableDialog open={open} onClose={saving ? undefined : onClose} maxWidth="sm" fullWidth>
      <DialogTitle>Создание наряда</DialogTitle>
      <DialogContent dividers>
        {loading ? (
          <Typography variant="body2" color="text.secondary">
            Загрузка…
          </Typography>
        ) : (
          <Stack spacing={2} sx={{ pt: 0.5 }}>
            <TextField
              label="Наименование наряда"
              value={name}
              onChange={(event) => setName(event.target.value)}
              fullWidth
              size="small"
              inputProps={{ maxLength: 50 }}
            />
            <FormControl fullWidth size="small" required>
              <InputLabel id="create-naryad-brigade-label">Бригада</InputLabel>
              <Select
                labelId="create-naryad-brigade-label"
                label="Бригада"
                value={brigadeId}
                onChange={(event) => setBrigadeId(event.target.value)}
                displayEmpty
              >
                <MenuItem value="" sx={{ display: 'none' }}>
                  Выберите бригаду
                </MenuItem>
                {brigades.map((brigade) => (
                  <MenuItem key={brigade.id} value={String(brigade.id)}>
                    {brigade.nm}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            {brigades.length === 0 ? (
              <Typography variant="body2" color="text.secondary">
                Нет доступных бригад
              </Typography>
            ) : null}
            <LocalizationProvider
              dateAdapter={AdapterDateFns}
              adapterLocale={ru}
              localeText={ruRU.components.MuiLocalizationProvider.defaultProps.localeText}
            >
              <DesktopDateTimePicker
                label="Дата и время начала работ"
                value={begDate ? parseISO(begDate) : null}
                onChange={(next) => {
                  setBegDate(next && isValid(next) ? format(next, "yyyy-MM-dd'T'HH:mm:ss") : null)
                }}
                format="dd.MM.yyyy HH:mm:ss"
                ampm={false}
                views={['year', 'month', 'day', 'hours', 'minutes', 'seconds']}
                timeSteps={{ hours: 1, minutes: 1, seconds: 1 }}
                minDateTime={new Date(2000, 0, 1)}
                maxDateTime={new Date(2101, 0, 1)}
                slotProps={{
                  textField: {
                    size: 'small',
                    fullWidth: true,
                    InputLabelProps: { shrink: true },
                  },
                  actionBar: { actions: ['clear', 'accept'] },
                  popper: { sx: clockSectionSx },
                  desktopPaper: { sx: clockSectionSx },
                }}
              />
            </LocalizationProvider>
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
        <Button variant="contained" onClick={handleCreate} disabled={!ready}>
          {saving ? 'Создание…' : 'Создать'}
        </Button>
      </DialogActions>
    </DraggableDialog>
  )
}
