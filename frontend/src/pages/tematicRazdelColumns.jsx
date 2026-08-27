import Box from '@mui/material/Box'
import IconButton from '@mui/material/IconButton'
import KeyboardArrowDown from '@mui/icons-material/KeyboardArrowDown'
import KeyboardArrowRight from '@mui/icons-material/KeyboardArrowRight'

/**
 * Колонки дерева тематических разделов (Delphi formStructNur: код / имя / oper).
 * Шеврона в BaseTreeTable нет — expander и отступ по row.depth только здесь.
 * Фильтры колонок выключены: в этом срезе только вывод.
 */
export const tematicRazdelColumns = [
  {
    accessorKey: 'id',
    header: 'Код раздела',
    size: 80,
    enableColumnFilter: false,
  },
  {
    accessorKey: 'name',
    header: 'Наименование',
    size: 400,
    enableColumnFilter: false,
    cell: ({ row, getValue }) => (
      <Box sx={{ display: 'flex', alignItems: 'center', minWidth: 0, pl: row.depth * 1.5 }}>
        {row.getCanExpand() ? (
          <IconButton
            size="small"
            aria-label={row.getIsExpanded() ? 'Свернуть' : 'Развернуть'}
            onClick={(e) => {
              e.stopPropagation()
              row.getToggleExpandedHandler()()
            }}
            sx={{ p: 0.25, mr: 0.5 }}
          >
            {row.getIsExpanded() ? (
              <KeyboardArrowDown fontSize="small" />
            ) : (
              <KeyboardArrowRight fontSize="small" />
            )}
          </IconButton>
        ) : (
          <Box sx={{ width: 28, flexShrink: 0, mr: 0.5 }} />
        )}
        <Box component="span" sx={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {getValue() ?? ''}
        </Box>
      </Box>
    ),
  },
  {
    accessorKey: 'oper',
    header: 'Код операции',
    size: 80,
    enableColumnFilter: false,
    cell: ({ getValue }) => getValue() ?? '',
  },
]
