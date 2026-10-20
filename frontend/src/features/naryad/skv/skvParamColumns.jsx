import { useEffect, useState } from 'react'
import Box from '@mui/material/Box'
import MenuItem from '@mui/material/MenuItem'
import Select from '@mui/material/Select'
import TextField from '@mui/material/TextField'
import { useSkvEditor } from './SkvEditorContext.jsx'
import { sanitizeSkvNumberInput, skvCellValue, skvChangedFields } from './skvRules.js'

const VALSTR_MAX_LENGTH = 150

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

/**
 * Список значений грузится через loadValues окна, а не DynamicSelect: тот отменяет
 * запрос при размонтировании, и перехватчик AxiosProvider принимает отмену
 * за сетевую ошибку и уводит на /#/login.
 */
function NmCell({ row }) {
  const { draft } = useSkvEditor()
  const changed = skvChangedFields(draft, row.original)
  const bold = changed.znval || changed.val || changed.valstr
  return (
    <Box component="span" sx={{ fontWeight: bold ? 700 : 400 }}>
      {row.original.nm ?? ''}
    </Box>
  )
}

function ZnvalCell({ row }) {
  const { readOnly, draft, setCell, loadValues } = useSkvEditor()
  const original = row.original
  const [options, setOptions] = useState(null)

  useEffect(() => {
    if (readOnly) return undefined
    let active = true
    loadValues(original.parcode)
      .then((items) => { if (active) setOptions(items) })
      .catch(() => { if (active) setOptions([]) })
    return () => { active = false }
  }, [readOnly, loadValues, original.parcode])

  if (readOnly) return original.znnm ?? ''
  const value = skvCellValue(draft, original, 'znval') ?? ''
  const known = options?.some((item) => String(item.id) === value) ?? false
  const bold = skvChangedFields(draft, original).znval
  return (
    <CellEditor>
      <Select
        value={known ? value : ''}
        onChange={(event) => setCell(original, 'znval', event.target.value === '' ? null : event.target.value)}
        variant="standard"
        size="small"
        fullWidth
        disableUnderline
        displayEmpty
        disabled={options == null}
        renderValue={(selected) => (
          options?.find((item) => String(item.id) === String(selected))?.nm ?? ''
        )}
        inputProps={{ 'aria-label': `Значение: ${original.nm ?? ''}` }}
        sx={{
          ...inputSx,
          '& .MuiSelect-select': { fontWeight: bold ? 700 : 400 },
        }}
      >
        <MenuItem value="">{'\u00a0'}</MenuItem>
        {(options ?? []).map((item) => (
          <MenuItem key={item.id} value={String(item.id)}>{item.nm}</MenuItem>
        ))}
      </Select>
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
        InputProps={{ disableUnderline: true }}
        inputProps={{ inputMode: 'decimal', 'aria-label': `Числовое: ${original.nm ?? ''}` }}
        sx={changedInputSx(skvChangedFields(draft, original).val)}
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
        InputProps={{ disableUnderline: true }}
        inputProps={{ maxLength: VALSTR_MAX_LENGTH, 'aria-label': `Строковое: ${original.nm ?? ''}` }}
        sx={changedInputSx(skvChangedFields(draft, original).valstr)}
      />
    </CellEditor>
  )
}

/** Колонки DBGrid1 formSkvZadVar / formSkvVipVar; код справочного значения не показываем. */
export const skvParamColumns = [
  { id: 'skv-nm', accessorKey: 'nm', header: 'Параметр', size: 220, cell: NmCell },
  { id: 'skv-znval', accessorKey: 'znnm', header: 'Значение', size: 220, cell: ZnvalCell },
  { id: 'skv-val', accessorKey: 'val', header: 'Числовое', size: 110, cell: ValCell },
  { id: 'skv-valstr', accessorKey: 'valstr', header: 'Строковое', size: 180, cell: ValstrCell },
]
