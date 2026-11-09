import { useEffect, useState } from 'react'
import Alert from '@mui/material/Alert'
import Button from '@mui/material/Button'
import DialogActions from '@mui/material/DialogActions'
import DialogContent from '@mui/material/DialogContent'
import DialogTitle from '@mui/material/DialogTitle'
import Stack from '@mui/material/Stack'
import Table from '@mui/material/Table'
import TableBody from '@mui/material/TableBody'
import TableCell from '@mui/material/TableCell'
import TableHead from '@mui/material/TableHead'
import TableRow from '@mui/material/TableRow'
import TextField from '@mui/material/TextField'
import Typography from '@mui/material/Typography'
import DateRange from '@mui/icons-material/DateRange'
import { LocalizationProvider } from '@mui/x-date-pickers'
import { DesktopDateTimePicker } from '@mui/x-date-pickers/DesktopDateTimePicker'
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns'
import { ruRU } from '@mui/x-date-pickers/locales'
import { format, isValid, parseISO } from 'date-fns'
import { ru } from 'date-fns/locale'
import {
  createVipolneniePeriod,
  deleteVipolneniePeriod,
  fetchVipolneniePeriods,
  updateVipolneniePeriod,
} from '../../../../api/naryadyApi.js'
import DraggableDialog from '../../../../components/DraggableDialog'
import { useConfirm } from '../../../../context/ConfirmContext.jsx'
import ActionButton from '../../workspace/ActionButton.jsx'
import { useNaryadWorkspace } from '../../workspace/NaryadWorkspaceContext.jsx'
import {
  PERIOD_DELETE_CONFIRM,
  PERIOD_NAME_MAX,
  formatPeriodStamp,
  periodFormError,
} from './periodRules.js'

const STAMP = "yyyy-MM-dd'T'HH:mm:ss"

function nowStamp() {
  return format(new Date(), STAMP)
}

function PeriodDateTimeField({ label, value, onChange }) {
  return (
    <LocalizationProvider
      dateAdapter={AdapterDateFns}
      adapterLocale={ru}
      localeText={ruRU.components.MuiLocalizationProvider.defaultProps.localeText}
    >
      <DesktopDateTimePicker
        label={label}
        value={value ? parseISO(value) : null}
        onChange={(next) => {
          onChange(next && isValid(next) ? format(next, STAMP) : '')
        }}
        format="dd.MM.yyyy HH:mm:ss"
        ampm={false}
        views={['year', 'month', 'day', 'hours', 'minutes', 'seconds']}
        timeSteps={{ hours: 1, minutes: 1, seconds: 1 }}
        slotProps={{
          textField: { size: 'small', fullWidth: true, required: true },
        }}
      />
    </LocalizationProvider>
  )
}

function PeriodEditDialog({ open, naryadId, period, onClose, onSaved }) {
  const editing = period != null
  const [nm, setNm] = useState('')
  const [beg, setBeg] = useState('')
  const [end, setEnd] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const formError = periodFormError({ nm, beg, end })

  useEffect(() => {
    if (!open) return
    setNm(period?.nm ?? '')
    setBeg(period?.begoperdate ?? nowStamp())
    setEnd(period?.outoperdate ?? nowStamp())
    setError('')
    setSaving(false)
  }, [open, period])

  async function save() {
    if (formError || saving) return
    setSaving(true)
    setError('')
    const body = { nm: nm.trim(), begoperdate: beg, outoperdate: end }
    try {
      if (editing) await updateVipolneniePeriod(naryadId, period.key, body)
      else await createVipolneniePeriod(naryadId, body)
      onSaved()
      onClose()
    } catch (saveError) {
      setError(saveError?.message || 'Не удалось сохранить период')
    } finally {
      setSaving(false)
    }
  }

  return (
    <DraggableDialog open={open} onClose={saving ? undefined : onClose} maxWidth="sm" fullWidth>
      <DialogTitle>
        {editing ? 'Редактирование существующего периода' : 'Добавление нового периода'}
      </DialogTitle>
      <DialogContent>
        <Stack spacing={2} sx={{ pt: 1 }}>
          <TextField
            label="Название периода"
            value={nm}
            onChange={(event) => setNm(event.target.value)}
            inputProps={{ maxLength: PERIOD_NAME_MAX }}
            size="small"
            required
            autoFocus
            fullWidth
          />
          <PeriodDateTimeField label="Начало выполнения работ" value={beg} onChange={setBeg} />
          <PeriodDateTimeField label="Окончание выполнения работ" value={end} onChange={setEnd} />
          {error ? <Alert severity="error">{error}</Alert> : null}
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={saving}>Отмена</Button>
        <Button variant="contained" onClick={save} disabled={Boolean(formError) || saving}>ОК</Button>
      </DialogActions>
    </DraggableDialog>
  )
}

function PeriodsDialog({ open, naryadId, readOnly, onClose }) {
  const confirm = useConfirm()
  const [periods, setPeriods] = useState([])
  const [selectedKey, setSelectedKey] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [editor, setEditor] = useState(null)
  const selected = periods.find((period) => period.key === selectedKey) ?? null

  async function load() {
    setLoading(true)
    setError('')
    try {
      const rows = await fetchVipolneniePeriods(naryadId)
      setPeriods(Array.isArray(rows) ? rows : [])
      setSelectedKey((current) => (
        Array.isArray(rows) && rows.some((period) => period.key === current) ? current : null
      ))
    } catch (loadError) {
      setError(loadError?.message || 'Не удалось загрузить периоды')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (!open) {
      setEditor(null)
      return undefined
    }
    let cancelled = false
    setLoading(true)
    setError('')
    fetchVipolneniePeriods(naryadId)
      .then((rows) => {
        if (cancelled) return
        setPeriods(Array.isArray(rows) ? rows : [])
        setSelectedKey(null)
      })
      .catch((loadError) => {
        if (!cancelled) setError(loadError?.message || 'Не удалось загрузить периоды')
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [open, naryadId])

  async function removeSelected() {
    if (!selected || readOnly) return
    const accepted = await confirm(PERIOD_DELETE_CONFIRM, {
      action: 'удаление',
      confirmLabel: 'Удалить',
    })
    if (!accepted) return
    setError('')
    try {
      await deleteVipolneniePeriod(naryadId, selected.key)
      await load()
    } catch (deleteError) {
      setError(deleteError?.message || 'Не удалось удалить период')
    }
  }

  return (
    <>
      <DraggableDialog open={open} onClose={onClose} maxWidth="md" fullWidth>
        <DialogTitle>Настройка периодов выполнения работ</DialogTitle>
        <DialogContent>
          <Stack direction="row" spacing={1} sx={{ mb: 1 }}>
            <Button size="small" disabled={readOnly} onClick={() => setEditor({ period: null })}>
              Добавить период
            </Button>
            <Button
              size="small"
              disabled={readOnly || !selected}
              onClick={() => setEditor({ period: selected })}
            >
              Редактировать период
            </Button>
            <Button size="small" color="error" disabled={readOnly || !selected} onClick={removeSelected}>
              Удалить период
            </Button>
          </Stack>
          {error ? <Alert severity="error" sx={{ mb: 1 }}>{error}</Alert> : null}
          {loading ? (
            <Typography variant="body2" color="text.secondary">Загрузка…</Typography>
          ) : (
            <Table size="small" aria-label="Периоды выполнения">
              <TableHead>
                <TableRow>
                  <TableCell>Название</TableCell>
                  <TableCell>Дата начала работ</TableCell>
                  <TableCell>Дата окончания работ</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {periods.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={3}>
                      <Typography variant="body2" color="text.secondary">Периодов нет</Typography>
                    </TableCell>
                  </TableRow>
                ) : periods.map((period) => (
                  <TableRow
                    key={period.key}
                    hover
                    selected={period.key === selectedKey}
                    onClick={() => setSelectedKey(period.key)}
                    sx={{ cursor: 'pointer' }}
                  >
                    <TableCell>{period.nm}</TableCell>
                    <TableCell>{formatPeriodStamp(period.begoperdate)}</TableCell>
                    <TableCell>{formatPeriodStamp(period.outoperdate)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </DialogContent>
        <DialogActions>
          <Button variant="contained" onClick={onClose}>ОК</Button>
        </DialogActions>
      </DraggableDialog>
      <PeriodEditDialog
        open={editor != null}
        naryadId={naryadId}
        period={editor?.period ?? null}
        onClose={() => setEditor(null)}
        onSaved={load}
      />
    </>
  )
}

/** Delphi actListPeriod. Список открывается и у закрытого выполнения. */
export function ListPeriodsButton() {
  const ctx = useNaryadWorkspace()
  const [open, setOpen] = useState(false)

  function close() {
    setOpen(false)
    ctx.tree.reload()
    ctx.refreshPeriodTotals()
  }

  return (
    <>
      <ActionButton
        label="Настройка периодов выполнения работ"
        icon={DateRange}
        disabled={false}
        onClick={() => setOpen(true)}
      />
      <PeriodsDialog
        open={open}
        naryadId={ctx.naryadId}
        readOnly={ctx.closed !== false}
        onClose={close}
      />
    </>
  )
}

export const listPeriodsAction = {
  id: 'list-periods',
  Component: ListPeriodsButton,
}
