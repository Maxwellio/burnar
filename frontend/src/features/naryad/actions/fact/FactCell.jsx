import Box from '@mui/material/Box'
import TextField from '@mui/material/TextField'
import Tooltip from '@mui/material/Tooltip'
import { useEffect, useRef, useState } from 'react'
import { saveVipolnenieFact } from '../../../../api/naryadyApi.js'
import { formatSkvNumber, sanitizeSkvNumberInput } from '../../skv/skvRules.js'
import { useNaryadWorkspace } from '../../workspace/NaryadWorkspaceContext.jsx'
import { workFieldValue } from '../calc/workPatches.js'
import { FACT_KORR_HINT, canEditFact, factCommitValue } from './factRules.js'

const inputSx = {
  bgcolor: 'transparent',
  '& .MuiInputBase-root': { bgcolor: 'transparent' },
  '& .MuiInputBase-input': {
    py: 0,
    fontSize: '0.875rem',
    lineHeight: 1.15,
    bgcolor: 'transparent',
  },
}

function wait(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

function CellEditor({ children }) {
  return (
    <Box
      onClick={(event) => event.stopPropagation()}
      onMouseDown={(event) => event.stopPropagation()}
      sx={{ width: '100%' }}
    >
      {children}
    </Box>
  )
}

function factHours(row, getValue, overrides) {
  const patch = overrides.get(String(row.original?.id))
  if (patch && Object.prototype.hasOwnProperty.call(patch, 'fact')) {
    return workFieldValue(row.original, 'fact', overrides)
  }
  const value = getValue()
  return value == null ? '' : value
}

async function commitFact(ctx, row, value, revert) {
  if (row?.id == null) {
    revert()
    return
  }
  await ctx.enqueueSave(async () => {
    while (ctx.mutation.isPending()) await wait(20)
    if (!ctx.mutation.acquire()) {
      revert()
      return
    }
    try {
      const result = await saveVipolnenieFact(ctx.naryadId, row.id, value)
      ctx.workValues.apply([{ id: result?.id ?? row.id, fact: result?.fact ?? null }])
      ctx.refreshTotals()
      ctx.refreshPeriodTotals()
    } catch (error) {
      revert()
      await ctx.showAlert(error?.message || 'Операция не выполнена')
    } finally {
      ctx.mutation.release()
    }
  })
}

function FactEditor({ row, original }) {
  const ctx = useNaryadWorkspace()
  const [text, setText] = useState(original)
  const [busy, setBusy] = useState(false)
  const skip = useRef(false)

  useEffect(() => {
    setText(original)
  }, [original, row.id])

  async function commit(nextText) {
    const decision = factCommitValue(original, nextText)
    if (!decision.save) {
      if (decision.revert) setText(original)
      return
    }
    setBusy(true)
    try {
      await commitFact(ctx, row, decision.value, () => setText(original))
    } finally {
      setBusy(false)
    }
  }

  return (
    <CellEditor>
      <TextField
        value={text}
        disabled={busy}
        onChange={(event) => setText(sanitizeSkvNumberInput(event.target.value))}
        onBlur={() => {
          if (skip.current) {
            skip.current = false
            return
          }
          void commit(text)
        }}
        onKeyDown={(event) => {
          if (event.key === 'Escape') {
            skip.current = true
            setText(original)
            event.currentTarget.blur()
          } else if (event.key === 'Enter') {
            event.preventDefault()
            event.currentTarget.blur()
          }
        }}
        variant="standard"
        size="small"
        fullWidth
        InputProps={{ disableUnderline: true }}
        inputProps={{ inputMode: 'decimal', 'aria-label': 'Факт' }}
        sx={inputSx}
      />
    </CellEditor>
  )
}

/** Колонка «Факт». Закрытая часть, блокировка, блок, тип 81 и корреляция остаются текстом. */
export function FactCell({ row, getValue }) {
  const ctx = useNaryadWorkspace()
  const hours = factHours(row, getValue, ctx.workValues.overrides)
  const original = row.original ?? {}
  if (!canEditFact(original, ctx.closed)) {
    const text = hours == null || hours === '' ? '' : hours
    if (original.kor === 1 || original.kor === '1') {
      return (
        <Tooltip title={FACT_KORR_HINT}>
          <Box component="span" sx={{ display: 'inline-block', minWidth: 24, minHeight: '1.15em' }}>
            {text}
          </Box>
        </Tooltip>
      )
    }
    return text
  }
  return <FactEditor row={original} original={formatSkvNumber(hours)} />
}
