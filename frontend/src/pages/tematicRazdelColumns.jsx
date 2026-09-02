import Box from '@mui/material/Box'
import IconButton from '@mui/material/IconButton'
import Add from '@mui/icons-material/Add'
import Remove from '@mui/icons-material/Remove'

/** Отступ одного уровня (~32px). */
const LEVEL_INDENT = 4
const EXPANDER_SIZE = 30

/**
 * Колонки дерева тематических разделов (Delphi formStructNur: код / имя / oper).
 * Expander и отступ по row.depth только здесь (в BaseTreeTable шеврона нет).
 * Поиск: текстовые фильтры шапки (id/oper — префикс, name — подстрока).
 */
export const tematicRazdelColumns = [
  {
    accessorKey: 'id',
    header: 'Код раздела',
    size: 80,
    enableColumnFilter: true,
  },
  {
    accessorKey: 'name',
    header: 'Наименование',
    size: 400,
    enableColumnFilter: true,
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
    accessorKey: 'oper',
    header: 'Код операции',
    size: 80,
    enableColumnFilter: true,
    cell: ({ getValue }) => getValue() ?? '',
  },
]
