import { useState } from 'react'
import Button from '@mui/material/Button'
import DialogActions from '@mui/material/DialogActions'
import DialogContent from '@mui/material/DialogContent'
import DialogTitle from '@mui/material/DialogTitle'
import MenuItem from '@mui/material/MenuItem'
import TextField from '@mui/material/TextField'
import EventAvailable from '@mui/icons-material/EventAvailable'
import { bindVipolneniePeriod, fetchVipolneniePeriods } from '../../../../api/naryadyApi.js'
import DraggableDialog from '../../../../components/DraggableDialog'
import ActionButton from '../../workspace/ActionButton.jsx'
import { useNaryadWorkspace } from '../../workspace/NaryadWorkspaceContext.jsx'
import {
  NO_PERIODS_MESSAGE,
  canOpenPeriodBind,
  periodBindIds,
  periodBindRefusal,
  periodBindRows,
  periodOptionLabel,
} from './periodRules.js'

function BindPeriodDialog({ open, periods, onClose, onConfirm, pending }) {
  const [periodKey, setPeriodKey] = useState(periods[0]?.key ?? '')

  return (
    <DraggableDialog open={open} onClose={pending ? undefined : onClose} maxWidth="xs" fullWidth>
      <DialogTitle>Выберите период</DialogTitle>
      <DialogContent>
        <TextField
          select
          label="Период"
          value={periodKey}
          onChange={(event) => setPeriodKey(event.target.value)}
          size="small"
          fullWidth
          sx={{ mt: 1 }}
        >
          {periods.map((period) => (
            <MenuItem key={period.key} value={period.key}>
              {periodOptionLabel(period)}
            </MenuItem>
          ))}
        </TextField>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={pending}>Отмена</Button>
        <Button variant="contained" onClick={() => onConfirm(periodKey)} disabled={pending || periodKey === ''}>
          ОК
        </Button>
      </DialogActions>
    </DraggableDialog>
  )
}

/** Delphi actSelPeriodOper: период пишется только строкам, которые грид умеет выделить. */
export function BindPeriodButton() {
  const ctx = useNaryadWorkspace()
  const [busy, setBusy] = useState(false)
  const [dialog, setDialog] = useState(null)
  const rows = periodBindRows(ctx.tree.selectedIds, ctx.structureById, ctx.lockFlags)
  const disabled = busy || !canOpenPeriodBind(rows, ctx.closed, ctx.mutation.pending)

  async function open() {
    const current = periodBindRows(
      ctx.tree.getSelectedIds(),
      ctx.getStructure(),
      ctx.getLockFlags(),
    )
    if (!canOpenPeriodBind(current, ctx.getClosed(), ctx.mutation.isPending())) return
    const refusal = periodBindRefusal(current)
    if (refusal) {
      ctx.tree.resetSelection()
      await ctx.showAlert(refusal)
      return
    }
    setBusy(true)
    try {
      const periods = await fetchVipolneniePeriods(ctx.naryadId)
      if (!Array.isArray(periods) || periods.length === 0) {
        await ctx.showAlert(NO_PERIODS_MESSAGE)
        return
      }
      setDialog({ periods, nodeIds: periodBindIds(current) })
    } catch (error) {
      await ctx.showAlert(error?.message || 'Не удалось загрузить периоды')
    } finally {
      setBusy(false)
    }
  }

  async function confirm(periodKey) {
    const nodeIds = dialog?.nodeIds ?? []
    setDialog(null)
    await ctx.runMutation(async () => {
      await bindVipolneniePeriod(ctx.naryadId, periodKey, nodeIds)
      ctx.tree.resetSelection()
      ctx.refreshPeriodTotals()
    }, { reload: true })
  }

  return (
    <>
      <ActionButton
        label="Привязать выделенные операции к периоду"
        icon={EventAvailable}
        disabled={disabled}
        onClick={() => {
          void open()
        }}
      />
      {dialog ? (
        <BindPeriodDialog
          open
          periods={dialog.periods}
          pending={ctx.mutation.pending}
          onClose={() => setDialog(null)}
          onConfirm={(periodKey) => {
            void confirm(periodKey)
          }}
        />
      ) : null}
    </>
  )
}

export const bindPeriodAction = {
  id: 'bind-period',
  Component: BindPeriodButton,
}
