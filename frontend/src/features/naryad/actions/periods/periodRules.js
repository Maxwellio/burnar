import { isWorkLocked } from '../lock/lockRules.js'

/** varchar(128) у burnar.vipolnenie_period.nm. */
export const PERIOD_NAME_MAX = 128

export const NOT_ALL_LOCKED_MESSAGE = 'Не все работы заблокированы!'

export const NO_PERIODS_MESSAGE = 'Нет периодов выполнения работ.'

export const PERIOD_DELETE_CONFIRM =
  'Удаление периода снимет привязку работ и удалит значения отчёта этого периода. Продолжить?'

const NAME_REQUIRED = 'Укажите название периода'
const NAME_TOO_LONG = 'Название периода не длиннее 128 символов'
const DATES_REQUIRED = 'Укажите дату и время начала и окончания'
const END_BEFORE_BEGIN = 'Окончание не может быть раньше начала'

const STAMP = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2}):(\d{2})$/

function stamp(value) {
  return typeof value === 'string' && STAMP.test(value) ? value : null
}

/** null, если название и границы можно записать. */
export function periodFormError({ nm, beg, end }) {
  const name = typeof nm === 'string' ? nm.trim() : ''
  if (!name) return NAME_REQUIRED
  if (name.length > PERIOD_NAME_MAX) return NAME_TOO_LONG
  const begin = stamp(beg)
  const finish = stamp(end)
  if (!begin || !finish) return DATES_REQUIRED
  if (finish < begin) return END_BEFORE_BEGIN
  return null
}

export function formatPeriodStamp(value) {
  const match = STAMP.exec(String(value ?? ''))
  if (!match) return ''
  const [, year, month, day, hour, minute, second] = match
  return `${day}.${month}.${year} ${hour}:${minute}:${second}`
}

const PERIOD_COLUMN_MAX = 4000

/** Колонки BaseTable списка периодов. id строки таблица берёт из поля id. */
export function periodListColumnDefs() {
  return [
    {
      id: 'period_nm',
      accessorKey: 'nm',
      header: 'Название',
      size: 250,
      maxSize: PERIOD_COLUMN_MAX,
      enableColumnFilter: false,
    },
    {
      id: 'period_beg',
      accessorKey: 'begoperdate',
      header: 'Дата начала работ',
      size: 180,
      maxSize: PERIOD_COLUMN_MAX,
      enableColumnFilter: false,
      cell: ({ getValue }) => formatPeriodStamp(getValue()),
    },
    {
      id: 'period_end',
      accessorKey: 'outoperdate',
      header: 'Дата окончания работ',
      size: 190,
      maxSize: PERIOD_COLUMN_MAX,
      enableColumnFilter: false,
      cell: ({ getValue }) => formatPeriodStamp(getValue()),
    },
  ]
}

/** Подпись пункта, как ComboBox Delphi: имя и обе границы. */
export function periodOptionLabel(period) {
  const name = period?.nm ?? ''
  return `${name} (${formatPeriodStamp(period?.begoperdate)} - ${formatPeriodStamp(period?.outoperdate)})`
}

/**
 * Любая выбранная строка выполнения: операция, блок и тип 81.
 * Пока список блокировок не загружен, привязывать нечего.
 */
export function periodBindRows(selectedIds, lockFlags) {
  if (!(lockFlags instanceof Map) || !Array.isArray(selectedIds)) return []
  const rows = []
  for (const id of selectedIds) {
    const key = String(id)
    if (!lockFlags.has(key)) continue
    rows.push({ id, locked: lockFlags.get(key) })
  }
  return rows
}

export function periodBindIds(rows) {
  return (Array.isArray(rows) ? rows : []).map((row) => row.id)
}

export function canOpenPeriodBind(rows, closed, pending = false) {
  if (closed === true || pending) return false
  return Array.isArray(rows) && rows.length > 0
}

/** Сообщение отказа, если среди привязываемых строк есть незаблокированная. */
export function periodBindRefusal(rows) {
  if (!Array.isArray(rows) || rows.some((row) => !isWorkLocked(row.locked))) {
    return NOT_ALL_LOCKED_MESSAGE
  }
  return null
}
