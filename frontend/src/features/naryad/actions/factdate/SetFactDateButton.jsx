import { useEffect, useState } from 'react'
import Alert from '@mui/material/Alert'
import Button from '@mui/material/Button'
import DialogActions from '@mui/material/DialogActions'
import DialogContent from '@mui/material/DialogContent'
import DialogTitle from '@mui/material/DialogTitle'
import Stack from '@mui/material/Stack'
import EventAvailable from '@mui/icons-material/EventAvailable'
import { LocalizationProvider } from '@mui/x-date-pickers'
import { DesktopDateTimePicker } from '@mui/x-date-pickers/DesktopDateTimePicker'
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns'
import { ruRU } from '@mui/x-date-pickers/locales'
import { format, isValid, parseISO } from 'date-fns'
import { ru } from 'date-fns/locale'
import {
  fetchVipolnenieBegoperdate,
  setVipolnenieBegoperdate,
} from '../../../../api/naryadyApi.js'
import DraggableDialog from '../../../../components/DraggableDialog'
import ActionButton from '../../workspace/ActionButton.jsx'
import { useNaryadWorkspace } from '../../workspace/NaryadWorkspaceContext.jsx'
import {
  FACT_DATE_DIALOG_TITLE,
  FACT_DATE_LABEL,
  FACT_DATE_SAVED_MESSAGE,
  canSetFactDate,
  factDateFormError,
  factDateInitial,
} from './factDateRules.js'

const STAMP = "yyyy-MM-dd'T'HH:mm:ss"

/** Как в сквозных параметрах: колонка MUI прокручивается, полосы не видно. */
const clockSectionSx = {
  '& .MuiMultiSectionDigitalClockSection-root': {
    scrollbarWidth: 'none',
    msOverflowStyle: 'none',
    '&::-webkit-scrollbar': { display: 'none' },
    '&::after': { content: 'none', height: 0 },
  },
}

function nowStamp() {
  return format(new Date(), STAMP)
}

function FactDateDialog({ open, value, pending, onClose, onConfirm }) {
  const [stamp, setStamp] = useState(value ?? '')

  useEffect(() => {
    if (open) setStamp(value ?? '')
  }, [open, value])

  const formError = factDateFormError(stamp)

  return (
    <DraggableDialog open={open} onClose={pending ? undefined : onClose} maxWidth="xs" fullWidth>
      <DialogTitle>{FACT_DATE_DIALOG_TITLE}</DialogTitle>
      <DialogContent>
        <Stack spacing={1.5} sx={{ pt: 1 }}>
          <LocalizationProvider
            dateAdapter={AdapterDateFns}
            adapterLocale={ru}
            localeText={ruRU.components.MuiLocalizationProvider.defaultProps.localeText}
          >
            <DesktopDateTimePicker
              label="Дата начала"
              value={stamp ? parseISO(stamp) : null}
              onChange={(next) => {
                setStamp(next && isValid(next) ? format(next, STAMP) : '')
              }}
              format="dd.MM.yyyy HH:mm:ss"
              ampm={false}
              views={['year', 'month', 'day', 'hours', 'minutes', 'seconds']}
              timeSteps={{ hours: 1, minutes: 1, seconds: 1 }}
              slotProps={{
                textField: { size: 'small', fullWidth: true, required: true },
                popper: { sx: clockSectionSx },
                desktopPaper: { sx: clockSectionSx },
              }}
            />
          </LocalizationProvider>
          {formError && stamp === '' ? <Alert severity="error">{formError}</Alert> : null}
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={pending}>Отмена</Button>
        <Button
          variant="contained"
          onClick={() => onConfirm(stamp)}
          disabled={Boolean(formError) || pending}
        >
          ОК
        </Button>
      </DialogActions>
    </DraggableDialog>
  )
}

/** Delphi actsetdateHANDmla. Следующие работы не сдвигаются. */
export function SetFactDateButton() {
  const ctx = useNaryadWorkspace()
  const [dialog, setDialog] = useState(null)
  const enabled = canSetFactDate(
    ctx.tree.selectedIds,
    ctx.lockFlags,
    ctx.closed,
    ctx.mutation.pending,
  )

  async function open() {
    const ids = ctx.tree.getSelectedIds()
    if (!canSetFactDate(ids, ctx.getLockFlags(), ctx.getClosed(), ctx.mutation.isPending())) return
    const nodeId = ids[0]
    try {
      const current = await fetchVipolnenieBegoperdate(ctx.naryadId, nodeId)
      if (!canSetFactDate(ctx.tree.getSelectedIds(), ctx.getLockFlags(), ctx.getClosed(), ctx.mutation.isPending())) {
        return
      }
      setDialog({
        nodeId,
        begoperdate: factDateInitial(current?.begoperdate, nowStamp()),
      })
    } catch (error) {
      await ctx.showAlert(error?.message || 'Не удалось прочитать дату начала')
    }
  }

  async function confirm(begoperdate) {
    if (!dialog || factDateFormError(begoperdate)) return
    const nodeId = dialog.nodeId
    let saved = false
    await ctx.runMutation(async () => {
      const result = await setVipolnenieBegoperdate(ctx.naryadId, nodeId, begoperdate)
      ctx.workValues.apply([{ id: result?.id ?? nodeId, begoperdate: result?.begoperdate ?? '' }])
      saved = true
      await ctx.showAlert(FACT_DATE_SAVED_MESSAGE)
    })
    if (saved) setDialog(null)
  }

  return (
    <>
      <ActionButton
        label={FACT_DATE_LABEL}
        icon={EventAvailable}
        disabled={!enabled}
        onClick={() => {
          void open()
        }}
      />
      <FactDateDialog
        open={dialog != null}
        value={dialog?.begoperdate}
        pending={ctx.mutation.pending}
        onClose={() => {
          if (!ctx.mutation.pending) setDialog(null)
        }}
        onConfirm={(value) => {
          void confirm(value)
        }}
      />
    </>
  )
}

export const setFactDateAction = {
  id: 'set-fact-date',
  Component: SetFactDateButton,
}
