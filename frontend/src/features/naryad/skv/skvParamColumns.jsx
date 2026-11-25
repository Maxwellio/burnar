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
 * Колонки значения параметра для сквозных и общих параметров.
 * Список грузится вместе со строкой, а не DynamicSelect: тот отменяет запрос
 * при размонтировании, и AxiosProvider принимает отмену за выход из сессии.
 */
export function createValueParamColumns({
  idPrefix,
  valueHeader,
  useEditor,
  cellEditable,
  cellValue,
  changedFields,
  valstrMax = VALSTR_MAX_LENGTH,
}) {
  function NmCell({ row }) {
    const { draft } = useEditor()
    const changed = changedFields(draft, row.original)
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
    const editor = useEditor()
    const original = row.original
    const options = Array.isArray(original.values) ? original.values : []
    if (!cellEditable(editor, original)) return original.znnm ?? ''
    const value = cellValue(editor.draft, original, 'znval') ?? ''
    const known = options.some((item) => String(item.id) === String(value))
    const bold = changedFields(editor.draft, original).znval
    return (
      <CellEditor>
        <Select
          value={known ? String(value) : ''}
          onChange={(event) => editor.setCell(original, 'znval', event.target.value === '' ? null : event.target.value)}
          variant="standard"
          size="small"
          fullWidth
          disableUnderline
          displayEmpty
          renderValue={(selected) => (
            options.find((item) => String(item.id) === String(selected))?.nm ?? ''
          )}
          inputProps={{ 'aria-label': `${valueHeader}: ${original.nm ?? ''}` }}
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
    const editor = useEditor()
    const original = row.original
    const value = cellValue(editor.draft, original, 'val')
    if (!cellEditable(editor, original)) return value
    return (
      <CellEditor>
        <TextField
          value={value}
          onChange={(event) => editor.setCell(original, 'val', sanitizeSkvNumberInput(event.target.value))}
          variant="standard"
          size="small"
          fullWidth
          InputProps={{ disableUnderline: true }}
          inputProps={{ inputMode: 'decimal', 'aria-label': `Числовое: ${original.nm ?? ''}` }}
          sx={changedInputSx(changedFields(editor.draft, original).val)}
        />
      </CellEditor>
    )
  }

  function ValstrCell({ row }) {
    const editor = useEditor()
    const original = row.original
    const value = cellValue(editor.draft, original, 'valstr')
    if (!cellEditable(editor, original)) return value
    const bold = changedFields(editor.draft, original).valstr
    return (
      <CellEditor>
        <TextField
          value={value}
          onChange={(event) => editor.setCell(original, 'valstr', event.target.value)}
          variant="standard"
          size="small"
          fullWidth
          multiline
          minRows={1}
          InputProps={{ disableUnderline: true }}
          inputProps={{ maxLength: valstrMax, 'aria-label': `Строковое: ${original.nm ?? ''}` }}
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

  return [
    { id: `${idPrefix}-nm`, accessorKey: 'nm', header: 'Параметр', size: 220, cell: NmCell },
    { id: `${idPrefix}-znval`, accessorKey: 'znnm', header: valueHeader, size: 220, cell: ZnvalCell },
    { id: `${idPrefix}-val`, accessorKey: 'val', header: 'Числовое', size: 110, cell: ValCell },
    { id: `${idPrefix}-valstr`, accessorKey: 'valstr', header: 'Строковое', size: 180, cell: ValstrCell },
  ]
}

/** Колонки DBGrid1 formSkvZadVar / formSkvVipVar; код справочного значения не показываем. */
export const skvParamColumns = createValueParamColumns({
  idPrefix: 'skv',
  valueHeader: 'Значение',
  useEditor: useSkvEditor,
  cellEditable: (editor) => !editor.readOnly,
  cellValue: skvCellValue,
  changedFields: skvChangedFields,
})
