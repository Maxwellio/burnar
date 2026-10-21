import Box from '@mui/material/Box'
import TextField from '@mui/material/TextField'
import { BaseTable } from 'mainComponent'
import { naryadCompactTableSx } from '../naryadPageLayout.js'

/** Пустое поле — несколько строк; дальше высота растёт по тексту, лишнее прокручивается внутри рамки. */
const ALG_FIELD_MIN_ROWS = 4
const ALG_FIELD_MAX_ROWS = 12

const noopSetFilters = () => {}

/**
 * Правая панель вкладки: параметры операции (Delphi GrdParams) и алгоритм (algInfo).
 * Ширину задаёт родитель; панель только заполняет её.
 */
export default function WorkDetailsPanel({ paramsUrl, paramColumns, paramFilters, algorithm }) {
  return (
    <>
      <Box sx={{ flex: 1, minHeight: 0, minWidth: 0, overflow: 'hidden', ...naryadCompactTableSx }}>
        <BaseTable
          url={paramsUrl}
          columns={paramColumns}
          filters={paramFilters}
          setFilters={noopSetFilters}
        />
      </Box>
      <Box
        sx={{
          flex: '0 1 auto',
          minHeight: 0,
          overflow: 'auto',
          px: 1,
          py: 0.75,
          boxSizing: 'border-box',
          borderTop: 1,
          borderColor: 'divider',
          bgcolor: 'background.paper',
        }}
      >
        <TextField
          value={algorithm}
          multiline
          fullWidth
          size="small"
          minRows={ALG_FIELD_MIN_ROWS}
          maxRows={ALG_FIELD_MAX_ROWS}
          InputProps={{ readOnly: true }}
          inputProps={{ 'aria-label': 'Алгоритм', 'aria-readonly': true }}
          sx={{
            '& .MuiInputBase-root': {
              alignItems: 'flex-start',
            },
            '& textarea': {
              overflow: 'auto !important',
              resize: 'none',
            },
          }}
        />
      </Box>
    </>
  )
}
