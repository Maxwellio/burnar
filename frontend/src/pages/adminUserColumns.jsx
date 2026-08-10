/**
 * Колонки левой таблицы админ-панели (people + users).
 * Роль отложена — см. docs/admin-panel-notes.md.
 */
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

export const adminUserColumns = [
  {
    accessorKey: 'id',
    header: 'Код',
    size: 80,
    enableColumnFilter: true,
  },
  {
    accessorKey: 'fio',
    header: 'ФИО',
    size: 200,
    enableColumnFilter: true,
  },
  {
    accessorKey: 'oraName',
    header: 'Логин',
    size: 130,
    enableColumnFilter: true,
  },
  {
    accessorKey: 'active',
    header: 'Статус',
    size: 110,
    enableColumnFilter: false,
    cell: ({ getValue }) => formatActiveStatus(getValue()),
  },
  {
    accessorKey: 'dtEnter',
    header: 'Дата подкл.',
    size: 120,
    enableColumnFilter: false,
    cell: ({ getValue }) => formatIsoDate(getValue()),
  },
  {
    accessorKey: 'dtOut',
    header: 'Дата откл.',
    size: 120,
    enableColumnFilter: false,
    cell: ({ getValue }) => formatIsoDate(getValue()),
  },
  {
    accessorKey: 'note',
    header: 'Примечание',
    size: 200,
    enableColumnFilter: true,
  },
]
