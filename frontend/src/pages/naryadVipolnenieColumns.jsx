import { naryadZadanieColumns } from './naryadZadanieColumns.jsx'

/**
 * Колонки дерева работ наряда-выполнения (Delphi trGrdNar).
 * Как у задания, плюс видимые «Факт» и «Период».
 */
const eksColumn = naryadZadanieColumns[naryadZadanieColumns.length - 1]

export const naryadVipolnenieColumns = [
  ...naryadZadanieColumns.slice(0, -1),
  {
    accessorKey: 'fact',
    header: 'Факт',
    size: 70,
    enableColumnFilter: false,
  },
  eksColumn,
  {
    accessorKey: 'period_nm',
    header: 'Период',
    size: 180,
    enableColumnFilter: false,
  },
]
