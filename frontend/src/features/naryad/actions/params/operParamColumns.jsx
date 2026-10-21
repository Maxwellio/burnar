import Box from '@mui/material/Box'
import MenuItem from '@mui/material/MenuItem'
import Select from '@mui/material/Select'
import TextField from '@mui/material/TextField'
import { useEffect, useRef, useState } from 'react'
import { saveNaryadOperParam } from '../../../../api/naryadyApi.js'
import { sanitizeSkvNumberInput } from '../../skv/skvRules.js'
import { useNaryadWorkspace } from '../../workspace/NaryadWorkspaceContext.jsx'
import { continuousCommitValue, discreteCommitValue } from './operParamRules.js'

const inputSx = {
  '& .MuiInputBase-input': { py: 0, fontSize: '0.875rem', lineHeight: 1.15 },
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

/** Сохранение сразу, в одной очереди с расчётом. Ошибка возвращает ячейку к прежнему тексту. */
async function commitParam(ctx, row, value, revert) {
  if (row?.nodeId == null || row?.parcode == null) {
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
      const result = await saveNaryadOperParam(
        ctx.naryadId,
        ctx.part.id,
        row.nodeId,
        row.parcode,
        value,
      )
      if (result?.changed) {
        ctx.workValues.apply([{ id: row.nodeId, n1: null, n2: null, istnorm: null }])
        ctx.refreshTotals()
        ctx.reloadParams()
      }
    } catch (error) {
      revert()
      await ctx.showAlert(error?.message || 'Операция не выполнена')
    } finally {
      ctx.mutation.release()
    }
  })
}

function ContinuousParamEditor({ row }) {
  const ctx = useNaryadWorkspace()
  const original = row.val ?? ''
  const [text, setText] = useState(original)
  const [busy, setBusy] = useState(false)
  const skip = useRef(false)

  useEffect(() => {
    setText(original)
  }, [original, row.parcode, row.nodeId])

  async function commit(nextText) {
    const decision = continuousCommitValue(original, nextText)
    if (!decision.save) {
      if (decision.revert) setText(original)
      return
    }
    setBusy(true)
    try {
      await commitParam(ctx, row, decision.value, () => setText(original))
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
        inputProps={{ inputMode: 'decimal', 'aria-label': `Значение: ${row.nm ?? ''}` }}
        sx={inputSx}
      />
    </CellEditor>
  )
}

function DiscreteParamEditor({ row }) {
  const ctx = useNaryadWorkspace()
  const options = Array.isArray(row.values) ? row.values : []
  const original = row.znachCode == null || row.znachCode === '' ? '' : String(row.znachCode)
  const [selected, setSelected] = useState(original)
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    setSelected(original)
  }, [original, row.parcode, row.nodeId])

  const known = selected === '' || options.some((item) => String(item.id) === selected)
  const items = known || selected === ''
    ? options
    : [...options, { id: selected, nm: row.val ?? selected }]

  async function onChange(next) {
    const decision = discreteCommitValue(original, next)
    setSelected(next)
    if (!decision.save) return
    setBusy(true)
    try {
      await commitParam(ctx, row, decision.value, () => setSelected(original))
    } finally {
      setBusy(false)
    }
  }

  return (
    <CellEditor>
      <Select
        value={selected}
        disabled={busy}
        onChange={(event) => { void onChange(event.target.value) }}
        variant="standard"
        size="small"
        fullWidth
        disableUnderline
        displayEmpty
        renderValue={(value) => {
          if (value === '') return '\u00a0'
          return items.find((item) => String(item.id) === String(value))?.nm ?? row.val ?? ''
        }}
        inputProps={{ 'aria-label': `Значение: ${row.nm ?? ''}` }}
        sx={{
          ...inputSx,
          '& .MuiSelect-select': {
            whiteSpace: 'normal !important',
            overflowWrap: 'anywhere',
            textOverflow: 'clip !important',
            height: 'auto !important',
            lineHeight: 1.15,
            paddingTop: 0,
            paddingBottom: 0,
          },
        }}
      >
        <MenuItem value="">{'\u00a0'}</MenuItem>
        {items.map((item) => (
          <MenuItem key={String(item.id)} value={String(item.id)}>{item.nm}</MenuItem>
        ))}
      </Select>
    </CellEditor>
  )
}

/** ptype 1 — ввод, ptype 2 — список. Закрытая часть и блокировка выполнения оставляют текст. */
export function ParamValueCell({ row }) {
  const original = row.original ?? {}
  if (original.editable !== true) return original.val ?? ''
  if (Number(original.ptype) === 2) return <DiscreteParamEditor row={original} />
  if (Number(original.ptype) === 1) return <ContinuousParamEditor row={original} />
  return original.val ?? ''
}
