import Box from '@mui/material/Box'
import IconButton from '@mui/material/IconButton'
import Add from '@mui/icons-material/Add'
import Remove from '@mui/icons-material/Remove'

/** Отступ одного уровня (~32px), как в каталоге тематических разделов. */
const LEVEL_INDENT = 4
const EXPANDER_SIZE = 30

function WorkNameCell({ row, getValue }) {
  return (
    <Box sx={{ display: 'flex', alignItems: 'center', minWidth: 0, minHeight: EXPANDER_SIZE }}>
      {row.depth > 0 ? (
        <Box
          aria-hidden
          sx={{
            width: (theme) => theme.spacing(LEVEL_INDENT * row.depth),
            flexShrink: 0,
          }}
        />
      ) : null}
      {row.getCanExpand() ? (
        <IconButton
          size="small"
          disableRipple
          aria-label={row.getIsExpanded() ? 'Свернуть' : 'Развернуть'}
          onClick={(e) => {
            e.stopPropagation()
            row.getToggleExpandedHandler()()
          }}
          sx={{
            p: 0,
            mr: 0.75,
            width: EXPANDER_SIZE,
            height: EXPANDER_SIZE,
            color: 'text.primary',
            borderRadius: 0,
            backgroundColor: 'transparent',
            '&:hover': { backgroundColor: 'transparent' },
            '&:focus': { backgroundColor: 'transparent' },
            '&:active': { backgroundColor: 'transparent' },
          }}
        >
          {row.getIsExpanded() ? (
            <Remove sx={{ fontSize: 26 }} />
          ) : (
            <Add sx={{ fontSize: 26 }} />
          )}
        </IconButton>
      ) : (
        <Box sx={{ width: EXPANDER_SIZE, flexShrink: 0, mr: 0.75 }} />
      )}
      <Box
        component="span"
        sx={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}
      >
        {getValue() ?? ''}
      </Box>
    </Box>
  )
}

const workNameColumn = {
  accessorKey: 'nm',
  header: 'Название работы',
  size: 250,
  enableColumnFilter: false,
  cell: WorkNameCell,
}

/**
 * Колонки дерева задания (Delphi trGrdNar, видимые).
 * Expander в «Название работы» — в BaseTreeTable шеврона нет.
 */
export const naryadZadanieColumns = [
  { accessorKey: 'id', header: 'Код', size: 70, enableColumnFilter: false },
  { accessorKey: 'ord', header: '№ п/п', size: 80, enableColumnFilter: false },
  workNameColumn,
  { accessorKey: 'begoperdate', header: 'Время начала', size: 140, enableColumnFilter: false },
  { accessorKey: 'istnorm', header: 'Источник норм.', size: 140, enableColumnFilter: false },
  { accessorKey: 'ot', header: 'от', size: 50, enableColumnFilter: false },
  { accessorKey: 'do_', header: 'до', size: 50, enableColumnFilter: false },
  { accessorKey: 'n1', header: 'Н.в. на ед.', size: 90, enableColumnFilter: false },
  { accessorKey: 'n2', header: 'Н.в. на объём', size: 110, enableColumnFilter: false },
  { accessorKey: 'tipbur', header: 'ЭКС', size: 80, enableColumnFilter: false },
]

/** Как у задания, плюс видимые Delphi-поля «Факт» и «Период». */
export const naryadVipolnenieColumns = [
  ...naryadZadanieColumns.slice(0, -1),
  { accessorKey: 'fact', header: 'Факт', size: 70, enableColumnFilter: false },
  naryadZadanieColumns[naryadZadanieColumns.length - 1],
  { accessorKey: 'period_nm', header: 'Период', size: 180, enableColumnFilter: false },
]

/** Параметры операции (Delphi GrdParams): параметр / значение. */
export const naryadParamColumns = [
  { accessorKey: 'nm', header: 'Параметр', size: 140, enableColumnFilter: false },
  { accessorKey: 'val', header: 'Значение', size: 100, enableColumnFilter: false },
]
