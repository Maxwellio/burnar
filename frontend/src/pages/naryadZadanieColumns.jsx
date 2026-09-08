import Box from '@mui/material/Box'
import IconButton from '@mui/material/IconButton'
import Add from '@mui/icons-material/Add'
import Remove from '@mui/icons-material/Remove'

/** Отступ одного уровня (~32px), как в каталоге тематических разделов. */
const LEVEL_INDENT = 4
const EXPANDER_SIZE = 30

/**
 * Колонки дерева работ наряда-задания (Delphi trGrdNar, только видимые).
 * Expander в «Название работы» — в BaseTreeTable шеврона нет.
 * Фильтры колонок пока выключены.
 */
export const naryadZadanieColumns = [
  {
    accessorKey: 'id',
    header: 'Код',
    size: 70,
    enableColumnFilter: false,
  },
  {
    accessorKey: 'ord',
    header: '№ п/п',
    size: 80,
    enableColumnFilter: false,
  },
  {
    accessorKey: 'nm',
    header: 'Название работы',
    size: 250,
    enableColumnFilter: false,
    cell: ({ row, getValue }) => (
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
    ),
  },
  {
    accessorKey: 'begoperdate',
    header: 'Время начала',
    size: 140,
    enableColumnFilter: false,
  },
  {
    accessorKey: 'istnorm',
    header: 'Источник норм.',
    size: 140,
    enableColumnFilter: false,
  },
  {
    accessorKey: 'ot',
    header: 'от',
    size: 50,
    enableColumnFilter: false,
  },
  {
    accessorKey: 'do_',
    header: 'до',
    size: 50,
    enableColumnFilter: false,
  },
  {
    accessorKey: 'n1',
    header: 'Н.в. на ед.',
    size: 90,
    enableColumnFilter: false,
  },
  {
    accessorKey: 'n2',
    header: 'Н.в. на объём',
    size: 110,
    enableColumnFilter: false,
  },
  {
    accessorKey: 'tipbur',
    header: 'ЭКС',
    size: 80,
    enableColumnFilter: false,
  },
]
