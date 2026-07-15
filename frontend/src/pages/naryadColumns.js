/** Колонки списка нарядов — заголовки как в Delphi NarListUnit.grdDefNarList. */
export const naryadColumns = [
  {
    accessorKey: 'codNar',
    header: 'Код',
    size: 70,
  },
  {
    accessorKey: 'nameNar',
    header: 'Наименование',
    size: 180,
  },
  {
    accessorKey: 'ownerNar',
    header: 'Бригада',
    size: 220,
  },
  {
    accessorKey: 'masterNar',
    header: 'Мастер',
    size: 160,
  },
  {
    // В Delphi в ячейку ZadClose подставляется BegDate + иконка закрытия
    id: 'zadClose',
    header: 'План.Нач.Бур.',
    size: 120,
    accessorFn: (row) => row.begDate ?? '',
    cell: ({ row }) => {
      const closed = row.original.zadClose
      const mark = closed === '1' ? '■ ' : closed === '0' ? '□ ' : ''
      return `${mark}${row.original.begDate ?? ''}`
    },
  },
  {
    // В Delphi в ячейку VipClose подставляется PerVip + иконка
    id: 'vipClose',
    header: 'Учетные периоды',
    size: 180,
    accessorFn: (row) => row.perVip ?? '',
    cell: ({ row }) => {
      const closed = row.original.vipClose
      const mark = closed === '1' ? '■ ' : closed === '0' ? '□ ' : ''
      return `${mark}${row.original.perVip ?? ''}`
    },
  },
  {
    accessorKey: 'vipBegDate',
    header: 'Нач.Бур.',
    size: 100,
  },
  {
    accessorKey: 'skv',
    header: 'Скв.',
    size: 80,
  },
  {
    accessorKey: 'kust',
    header: 'Куст',
    size: 80,
  },
  {
    accessorKey: 'mest',
    header: 'Мест.',
    size: 120,
  },
  {
    accessorKey: 'dateCreate',
    header: 'Создан',
    size: 100,
  },
  {
    accessorKey: 'autorNar',
    header: 'Автор',
    size: 120,
  },
]
