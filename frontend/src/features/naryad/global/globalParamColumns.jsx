import Box from '@mui/material/Box'
import MenuItem from '@mui/material/MenuItem'
import Select from '@mui/material/Select'
import TextField from '@mui/material/TextField'
import { sanitizeSkvNumberInput } from '../skv/skvRules.js'
import { useGlobalEditor } from './GlobalEditorContext.jsx'
import {
  VALSTR_MAX,
  globalCellValue,
  globalChangedFields,
  globalRowEditable,
} from './globalRules.js'

const inputSx = {
  '& .MuiInputBase-input': { py: 0.5, fontSize: '0.875rem' },
}

function changedInputSx(changed) {
  return {
    ...inputSx,
    '& .MuiInputBase-input': {
      ...inputSx['& .MuiInputBase-input'],
      fontWeight: changed ? 700 : 400,
    },
  }
}

/** Клик по редактору не должен выделять строку таблицы (обработчик на tr). */
function CellEditor({ children }) {
  return (
    <Box onClick={(event) => event.stopPropagation()} sx={{ width: '100%' }}>
      {children}
    </Box>
  )
}

function NmCell({ row }) {
  const { draft } = useGlobalEditor()
  const changed = globalChangedFields(draft, row.original)
  const bold = changed.znval || changed.val || changed.valstr
  return (
    <Box
      component="span"
      sx={{ display: 'block', fontWeight: bold ? 700 : 400, whiteSpace: 'normal', overflowWrap: 'anywhere' }}
    >
      {row.original.nm ?? ''}
    </Box>
  )
}

function ZnvalCell({ row }) {
  const { closed, draft, setCell } = useGlobalEditor()
  const original = row.original
  const options = Array.isArray(original.values) ? original.values : []
  if (!globalRowEditable(closed, original.parcode).reference) return original.znnm ?? ''
  const value = globalCellValue(draft, original, 'znval') ?? ''
  const known = options.some((item) => String(item.id) === String(value))
  const bold = globalChangedFields(draft, original).znval
  return (
    <CellEditor>
      <Select
        value={known ? String(value) : ''}
        onChange={(event) => setCell(original, 'znval', event.target.value === '' ? null : event.target.value)}
        variant="standard"
        size="small"
        fullWidth
        disableUnderline
        displayEmpty
        renderValue={(selected) => (
          options.find((item) => String(item.id) === String(selected))?.nm ?? ''
        )}
        inputProps={{ 'aria-label': `Значение справочное: ${original.nm ?? ''}` }}
        sx={{
          ...inputSx,
          '& .MuiSelect-select': {
            fontWeight: bold ? 700 : 400,
            whiteSpace: 'normal !important',
            overflowWrap: 'anywhere',
            textOverflow: 'clip !important',
            height: 'auto !important',
            lineHeight: 1.35,
            paddingTop: '2px',
            paddingBottom: '2px',
          },
        }}
      >
        <MenuItem value="">{'\u00a0'}</MenuItem>
        {options.map((item) => (
          <MenuItem key={item.id} value={String(item.id)}>{item.nm}</MenuItem>
        ))}
      </Select>
    </CellEditor>
  )
}

function ValCell({ row }) {
  const { closed, draft, setCell } = useGlobalEditor()
  const original = row.original
  const value = globalCellValue(draft, original, 'val')
  if (!globalRowEditable(closed, original.parcode).value) return value
  return (
    <CellEditor>
      <TextField
        value={value}
        onChange={(event) => setCell(original, 'val', sanitizeSkvNumberInput(event.target.value))}
        variant="standard"
        size="small"
        fullWidth
        InputProps={{ disableUnderline: true }}
        inputProps={{ inputMode: 'decimal', 'aria-label': `Числовое: ${original.nm ?? ''}` }}
        sx={changedInputSx(globalChangedFields(draft, original).val)}
      />
    </CellEditor>
  )
}

function ValstrCell({ row }) {
  const { closed, draft, setCell } = useGlobalEditor()
  const original = row.original
  const value = globalCellValue(draft, original, 'valstr')
  if (!globalRowEditable(closed, original.parcode).value) return value
  const bold = globalChangedFields(draft, original).valstr
  return (
    <CellEditor>
      <TextField
        value={value}
        onChange={(event) => setCell(original, 'valstr', event.target.value)}
        variant="standard"
        size="small"
        fullWidth
        multiline
        minRows={1}
        InputProps={{ disableUnderline: true }}
        inputProps={{ maxLength: VALSTR_MAX, 'aria-label': `Строковое: ${original.nm ?? ''}` }}
        sx={{
          ...changedInputSx(bold),
          '& .MuiInputBase-root': { p: 0 },
          '& .MuiInputBase-input': {
            py: '2px',
            fontWeight: bold ? 700 : 400,
            whiteSpace: 'pre-wrap',
            height: 'auto',
          },
        }}
      />
    </CellEditor>
  )
}

/** Колонки средней таблицы GlobalVarUnit. Код справочного значения не показываем. */
export const globalParamColumns = [
  { id: 'global-nm', accessorKey: 'nm', header: 'Параметр', size: 220, cell: NmCell },
  { id: 'global-znval', accessorKey: 'znnm', header: 'Значение справочное', size: 220, cell: ZnvalCell },
  { id: 'global-val', accessorKey: 'val', header: 'Числовое', size: 110, cell: ValCell },
  { id: 'global-valstr', accessorKey: 'valstr', header: 'Строковое', size: 180, cell: ValstrCell },
]
