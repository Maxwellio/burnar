/** Узкая колонка автонумерации GrdParams (FixRowsAutoNum). */
export const PARAM_NUMBER_SIZE = 48

/** Номер строки в порядке ответа сервера, с 1. */
export function paramRowNumber(rowIndex) {
  return rowIndex + 1
}

/**
 * Колонки параметров операции. Сортировка выключена: номер — позиция в списке,
 * а не значение, которое меняется от клика по заголовку.
 */
export function paramColumnDefs(prefix) {
  return [
    {
      id: `${prefix}_num`,
      header: '№',
      size: PARAM_NUMBER_SIZE,
      enableSorting: false,
      enableColumnFilter: false,
    },
    {
      id: `${prefix}_nm`,
      accessorKey: 'nm',
      header: 'Параметр',
      size: 140,
      enableSorting: false,
      enableColumnFilter: false,
    },
    {
      id: `${prefix}_val`,
      accessorKey: 'val',
      header: 'Значение',
      size: 140,
      enableSorting: false,
      enableColumnFilter: false,
    },
  ]
}
