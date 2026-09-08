/**
 * Колонки параметров операции (Delphi GrdParams, ColCount=3).
 * Заголовки-заглушки: параметр / значение / единица (точные поля — когда появится API).
 */
export const naryadZadanieParamColumns = [
  {
    accessorKey: 'nm',
    header: 'Параметр',
    size: 140,
    enableColumnFilter: false,
  },
  {
    accessorKey: 'val',
    header: 'Значение',
    size: 100,
    enableColumnFilter: false,
  },
  {
    accessorKey: 'edizm',
    header: 'Ед. изм.',
    size: 80,
    enableColumnFilter: false,
  },
]
