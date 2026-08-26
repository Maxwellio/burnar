/**
 * Колонки левой таблицы админ-панели (people + users).
 * Роль отложена — см. docs/admin-panel-notes.md.
 */
import TableSortLabel from '@mui/material/TableSortLabel'
import { format, parseISO } from 'date-fns'

/** ISO yyyy-MM-dd → dd.MM.yyyy. */
function formatIsoDate(value) {
  if (!value) return ''
  try {
    return format(parseISO(value), 'dd.MM.yyyy')
  } catch {
    return value
  }
}

/** Как Delphi account_status: active=1 → Подключен. */
function formatActiveStatus(active) {
  if (active == null) return ''
  return active === 1 ? 'Подключен' : 'Отключен'
}

/** Хедер без встроенного фильтра: клик ASC↔DESC, стрелка только у активной колонки. */
function SortableHeader({ label, columnId, sortBy, sortDir, onSort }) {
  const active = sortBy === columnId
  return (
    <TableSortLabel
      active={active}
      direction={active ? sortDir : 'asc'}
      hideSortIcon={!active}
      onClick={(event) => {
        event.preventDefault()
        event.stopPropagation()
        onSort(columnId)
      }}
      sx={{
        width: '100%',
        cursor: 'pointer',
        '& .MuiTableSortLabel-icon': { fontSize: 16 },
      }}
    >
      {label}
    </TableSortLabel>
  )
}

/**
 * @param {{
 *   sortBy: string | null,
 *   sortDir: 'asc' | 'desc',
 *   onSort: (columnId: string) => void,
 * }} opts
 */
export function createAdminUserColumns({ sortBy, sortDir, onSort }) {
  return [
    {
      accessorKey: 'id',
      header: 'Код',
      size: 80,
      enableColumnFilter: true,
      enableSorting: false,
    },
    {
      accessorKey: 'fio',
      header: 'ФИО',
      size: 200,
      enableColumnFilter: true,
      enableSorting: false,
    },
    {
      accessorKey: 'oraName',
      header: 'Логин',
      size: 130,
      enableColumnFilter: true,
      enableSorting: false,
    },
    {
      accessorKey: 'active',
      header: (
        <SortableHeader
          label="Статус"
          columnId="active"
          sortBy={sortBy}
          sortDir={sortDir}
          onSort={onSort}
        />
      ),
      size: 110,
      enableColumnFilter: false,
      enableSorting: false,
      cell: ({ getValue }) => formatActiveStatus(getValue()),
    },
    {
      accessorKey: 'dtEnter',
      header: (
        <SortableHeader
          label="Дата подкл."
          columnId="dtEnter"
          sortBy={sortBy}
          sortDir={sortDir}
          onSort={onSort}
        />
      ),
      size: 120,
      enableColumnFilter: false,
      enableSorting: false,
      cell: ({ getValue }) => formatIsoDate(getValue()),
    },
    {
      accessorKey: 'dtOut',
      header: (
        <SortableHeader
          label="Дата откл."
          columnId="dtOut"
          sortBy={sortBy}
          sortDir={sortDir}
          onSort={onSort}
        />
      ),
      size: 120,
      enableColumnFilter: false,
      enableSorting: false,
      cell: ({ getValue }) => formatIsoDate(getValue()),
    },
    {
      accessorKey: 'note',
      header: 'Примечание',
      size: 200,
      enableColumnFilter: true,
      enableSorting: false,
    },
  ]
}
