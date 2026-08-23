/**
 * Колонки справочника должностей (Delphi SprDolj_list без rank).
 * id = sprdoljnost.key — BaseTable setSelectedId читает row.original.id.
 */
export const positionColumns = [
  {
    accessorKey: 'id',
    header: 'Код',
    size: 80,
    enableColumnFilter: true,
  },
  {
    accessorKey: 'nm',
    header: 'Наименование',
    size: 360,
    enableColumnFilter: true,
  },
]
