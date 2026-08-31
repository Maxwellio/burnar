import Box from '@mui/material/Box'
import IconButton from '@mui/material/IconButton'

/** Отступ одного уровня (~32px) + направляющая. */
const LEVEL_INDENT = 4
const EXPANDER_SIZE = 30
/** Направляющая заметнее divider: толще и ближе к text.secondary. */
const GUIDE_COLOR = '#64748B'

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
      <Box sx={{ display: 'flex', alignItems: 'stretch', minWidth: 0, minHeight: EXPANDER_SIZE }}>
        {Array.from({ length: row.depth }, (_, i) => (
          <Box
            key={i}
            aria-hidden
            sx={{
              width: (theme) => theme.spacing(LEVEL_INDENT),
              flexShrink: 0,
              borderLeft: '2px solid',
              borderColor: GUIDE_COLOR,
              ml: 0.5,
            }}
          />
        ))}
        <Box sx={{ display: 'flex', alignItems: 'center', minWidth: 0 }}>
          {row.getCanExpand() ? (
            <IconButton
              size="small"
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
                fontSize: 24,
                fontWeight: 700,
                lineHeight: 1,
                color: 'text.primary',
                borderRadius: 0.5,
              }}
            >
              {row.getIsExpanded() ? '−' : '+'}
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
