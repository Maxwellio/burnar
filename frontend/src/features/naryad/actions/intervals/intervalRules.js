import { delphiColorToCss } from '../color/naryadRowColors.js'

export const INTERVALS_LABEL = 'Проверить работы по мех.бурению на непрерывность интервалов'

export const INTERVALS_DIALOG_TITLE = 'Проверка интервалов'

export const INTERVAL_TABS = [
  { title: 'Мех.Бурение', path: 'intervals/mehbur', prefix: 'meh' },
  { title: 'Наращивание', path: 'intervals/narashchivanie', prefix: 'nar' },
]

const COLUMN_MAX = 4000

/** Пустое значение остаётся пустым. Число — два знака, как NumberFormat грида Delphi. */
export function formatIntervalBound(value) {
  if (value == null || value === '') return ''
  const number = Number(value)
  if (!Number.isFinite(number)) return ''
  return number.toFixed(2)
}

function textCell({ getValue }) {
  const value = getValue()
  return value == null ? '' : value
}

function boundCell({ getValue }) {
  return formatIntervalBound(getValue())
}

/** Колонки BaseTable одной вкладки. id разные, чтобы ширины вкладок не смешивались. */
export function intervalColumnDefs(prefix) {
  return [
    {
      id: `${prefix}_key`,
      accessorKey: 'id',
      header: 'Код',
      size: 70,
      maxSize: COLUMN_MAX,
      enableColumnFilter: false,
      cell: textCell,
    },
    {
      id: `${prefix}_prnum`,
      accessorKey: 'prnum',
      header: '№ п/п',
      size: 70,
      maxSize: COLUMN_MAX,
      enableColumnFilter: false,
      cell: textCell,
    },
    {
      id: `${prefix}_nm`,
      accessorKey: 'nm',
      header: 'Название',
      size: 300,
      maxSize: COLUMN_MAX,
      enableColumnFilter: false,
      cell: textCell,
    },
    {
      id: `${prefix}_ot`,
      accessorKey: 'ot',
      header: 'Интервал от',
      size: 150,
      maxSize: COLUMN_MAX,
      enableColumnFilter: false,
      cell: boundCell,
    },
    {
      id: `${prefix}_do`,
      accessorKey: 'do_',
      header: 'Интервал до',
      size: 150,
      maxSize: COLUMN_MAX,
      enableColumnFilter: false,
      cell: boundCell,
    },
  ]
}

/** 0 и пусто — без заливки. 8454143 из функций разрыва — #ffff80. */
export function intervalRowColor(row) {
  const value = Number(row?.colorsel)
  if (!Number.isInteger(value)) return undefined
  return delphiColorToCss(value)
}
