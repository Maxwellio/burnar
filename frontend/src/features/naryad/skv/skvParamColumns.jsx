import Box from '@mui/material/Box'
import TextField from '@mui/material/TextField'
import { DynamicSelect } from 'mainComponent'
import { useSkvEditor } from './SkvEditorContext.jsx'
import { sanitizeSkvNumberInput, skvCellValue } from './skvRules.js'

const VALSTR_MAX_LENGTH = 150

const inputSx = {
  '& .MuiInputBase-input': { py: 0.5, fontSize: '0.875rem' },
}

/** Клик по редактору не должен выделять строку таблицы (обработчик на tr). */
function CellEditor({ children }) {
  return (
    <Box onClick={(event) => event.stopPropagation()} sx={{ width: '100%' }}>
      {children}
    </Box>
  )
}

function ZnvalCell({ row }) {
  const { readOnly, draft, setCell, valuesUrl } = useSkvEditor()
  const original = row.original
  if (readOnly) return original.znnm ?? ''
  const value = skvCellValue(draft, original, 'znval')
  return (
    <CellEditor>
      <DynamicSelect
        contentApi={valuesUrl}
        params={{ parcode: original.parcode }}
        value={value ?? ''}
        onChange={(next) => setCell(original, 'znval', next === '' ? null : next)}
        size="small"
        aria-label={`Значение: ${original.nm ?? ''}`}
      />
    </CellEditor>
  )
}

function ValCell({ row }) {
  const { readOnly, draft, setCell } = useSkvEditor()
  const original = row.original
  const value = skvCellValue(draft, original, 'val')
  if (readOnly) return value
  return (
    <CellEditor>
      <TextField
        value={value}
        onChange={(event) => setCell(original, 'val', sanitizeSkvNumberInput(event.target.value))}
        variant="standard"
        size="small"
        fullWidth
        inputProps={{ inputMode: 'decimal', 'aria-label': `Числовое: ${original.nm ?? ''}` }}
        sx={inputSx}
      />
    </CellEditor>
  )
}

function ValstrCell({ row }) {
  const { readOnly, draft, setCell } = useSkvEditor()
  const original = row.original
  const value = skvCellValue(draft, original, 'valstr')
  if (readOnly) return value
  return (
    <CellEditor>
      <TextField
        value={value}
        onChange={(event) => setCell(original, 'valstr', event.target.value)}
        variant="standard"
        size="small"
        fullWidth
        inputProps={{ maxLength: VALSTR_MAX_LENGTH, 'aria-label': `Строковое: ${original.nm ?? ''}` }}
        sx={inputSx}
      />
    </CellEditor>
  )
}

/** Колонки DBGrid1 formSkvZadVar / formSkvVipVar; код справочного значения не показываем. */
export const skvParamColumns = [
  { id: 'skv-nm', accessorKey: 'nm', header: 'Параметр', size: 220 },
  { id: 'skv-znval', accessorKey: 'znnm', header: 'Значение', size: 220, cell: ZnvalCell },
  { id: 'skv-val', accessorKey: 'val', header: 'Числовое', size: 110, cell: ValCell },
  { id: 'skv-valstr', accessorKey: 'valstr', header: 'Строковое', size: 180, cell: ValstrCell },
]
