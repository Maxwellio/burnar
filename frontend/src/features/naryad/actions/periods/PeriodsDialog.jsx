import { useEffect, useMemo, useState } from 'react'
import Alert from '@mui/material/Alert'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import DialogActions from '@mui/material/DialogActions'
import DialogContent from '@mui/material/DialogContent'
import DialogTitle from '@mui/material/DialogTitle'
import Stack from '@mui/material/Stack'
import TextField from '@mui/material/TextField'
import DateRange from '@mui/icons-material/DateRange'
import { AxiosProvider, BaseTable } from 'mainComponent'
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
import { COLUMN_SIZING_KEYS, naryadCompactTableSx } from '../../naryadPageLayout.js'
import ActionButton from '../../workspace/ActionButton.jsx'
import useColumnSizingPersistence from '../../workspace/layout/useColumnSizingPersistence.js'
import { useNaryadWorkspace } from '../../workspace/NaryadWorkspaceContext.jsx'
import {
  PERIOD_DELETE_CONFIRM,
  PERIOD_NAME_MAX,
  periodFormError,
  periodListColumnDefs,
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

const NO_FILTERS = []
const ignoreFilters = () => {}

function samePeriodId(row, id) {
  return String(row?.id ?? row?.key) === String(id)
}

function PeriodsDialog({ open, naryadId, readOnly, onClose }) {
  const confirm = useConfirm()
  const [selectedId, setSelectedId] = useState(null)
  const [error, setError] = useState('')
  const [editor, setEditor] = useState(null)
  const [renderSignal, setRenderSignal] = useState(0)
  const columns = useMemo(() => periodListColumnDefs(), [])
  const url = `/naryady/${naryadId}/vipolnenie/periods`
  useColumnSizingPersistence([[url, COLUMN_SIZING_KEYS.vipolneniePeriods]])

  function reloadTable() {
    setRenderSignal((value) => value + 1)
  }

  useEffect(() => {
    if (open) return
    setEditor(null)
    setSelectedId(null)
    setError('')
  }, [open])

  async function editSelected(idArg) {
    const id = typeof idArg === 'number' || typeof idArg === 'string' ? idArg : selectedId
    if (id == null || readOnly) return
    setSelectedId(id)
    setError('')
    try {
      const rows = await fetchVipolneniePeriods(naryadId)
      const period = (Array.isArray(rows) ? rows : []).find((row) => samePeriodId(row, id))
      if (!period) {
        setError('Период не найден')
        return
      }
      setEditor({ period })
    } catch (loadError) {
      setError(loadError?.message || 'Не удалось загрузить период')
    }
  }

  async function removeSelected() {
    if (selectedId == null || readOnly) return
    const accepted = await confirm(PERIOD_DELETE_CONFIRM, {
      action: 'удаление',
      confirmLabel: 'Удалить',
    })
    if (!accepted) return
    setError('')
    try {
      await deleteVipolneniePeriod(naryadId, selectedId)
      setSelectedId(null)
      reloadTable()
    } catch (deleteError) {
      setError(deleteError?.message || 'Не удалось удалить период')
    }
  }

  return (
    <>
      <DraggableDialog
        open={open}
        onClose={onClose}
        maxWidth="md"
        fullWidth
        PaperProps={{ sx: { height: '70vh' } }}
      >
        <DialogTitle>Настройка периодов выполнения работ</DialogTitle>
        <DialogContent
          sx={{
            display: 'flex',
            flexDirection: 'column',
            minHeight: 0,
            overflow: 'hidden',
          }}
        >
          <Stack direction="row" spacing={1} sx={{ mb: 1, flexShrink: 0 }}>
            <Button size="small" disabled={readOnly} onClick={() => setEditor({ period: null })}>
              Добавить период
            </Button>
            <Button
              size="small"
              disabled={readOnly || selectedId == null}
              onClick={() => {
                void editSelected()
              }}
            >
              Редактировать период
            </Button>
            <Button
              size="small"
              color="error"
              disabled={readOnly || selectedId == null}
              onClick={() => {
                void removeSelected()
              }}
            >
              Удалить период
            </Button>
          </Stack>
          {error ? <Alert severity="error" sx={{ mb: 1, flexShrink: 0 }}>{error}</Alert> : null}
          <Box sx={{ flex: 1, minHeight: 0, overflow: 'hidden', ...naryadCompactTableSx }}>
            {open ? (
              <AxiosProvider baseapi="/api">
                <BaseTable
                  url={url}
                  columns={columns}
                  filters={NO_FILTERS}
                  setFilters={ignoreFilters}
                  setSelectedId={setSelectedId}
                  handleDoubleClick={readOnly ? undefined : editSelected}
                  reRenderSignal={renderSignal}
                />
              </AxiosProvider>
            ) : null}
          </Box>
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
        onSaved={reloadTable}
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
