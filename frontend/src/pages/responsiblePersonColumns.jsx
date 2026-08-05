/**
 * Колонки master-detail «Ответственные лица».
 * Левая таблица: people; правая: karjera (даты с бэка — yyyy-MM-dd).
 */
import { format, parseISO } from 'date-fns'

/** ISO yyyy-MM-dd → dd.MM.yyyy для отображения в таблице. */
function formatIsoDate(value) {
  if (!value) return ''
  try {
    return format(parseISO(value), 'dd.MM.yyyy')
  } catch {
    return value
  }
}

/** Люди: код / ФИО / логин — BaseTable выбирает по row.original.id (= people.id). */
export const peopleColumns = [
  {
    accessorKey: 'id',
    header: 'Код',
    size: 80,
    enableColumnFilter: true,
  },
  {
    accessorKey: 'fio',
    header: 'ФИО',
    size: 220,
    enableColumnFilter: true,
  },
  {
    accessorKey: 'oraName',
    header: 'Логин',
    size: 140,
    enableColumnFilter: true,
  },
]

/** Карьеры: даты форматируем из ISO; orgId/doljId в строке есть для форм, не показываем. */
export const careerColumns = [
  {
    accessorKey: 'dtEnter',
    header: 'Дата начала работы',
    size: 140,
    cell: ({ getValue }) => formatIsoDate(getValue()),
  },
  {
    accessorKey: 'dtOut',
    header: 'Дата окончания работы',
    size: 150,
    cell: ({ getValue }) => formatIsoDate(getValue()),
  },
  {
    accessorKey: 'doljNm',
    header: 'Должность',
    size: 180,
  },
  {
    accessorKey: 'orgNm',
    header: 'Отдел',
    size: 260,
  },
]
