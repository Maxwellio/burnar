/** Колонки BaseTable поиска скважины. id строки — ключ выбора, не код скважины. */

const sizing = {
  minSize: 40,
  maxSize: 4000,
  enableColumnFilter: false,
  enableSorting: false,
}

function showId(value) {
  if (value == null || value === '') return ''
  return String(value).replace(/\.0+$/, '')
}

function text(value) {
  return value ?? ''
}

export function wellSearchColumns(cacheRef) {
  return [
    {
      ...sizing,
      id: 'well_number',
      accessorKey: 'number',
      header: '№',
      size: 88,
      cell: ({ row }) => {
        const original = row.original ?? {}
        if (original.id != null) cacheRef.current.set(String(original.id), original)
        return text(original.number)
      },
    },
    {
      ...sizing,
      id: 'well_label',
      accessorKey: 'wellLabel',
      header: 'Скважина',
      size: 140,
      cell: ({ row }) => text(row.original?.wellLabel),
    },
    {
      ...sizing,
      id: 'kust_label',
      accessorKey: 'kustLabel',
      header: 'Куст',
      size: 120,
      cell: ({ row }) => text(row.original?.kustLabel),
    },
    {
      ...sizing,
      id: 'mest_nm',
      accessorKey: 'mestNm',
      header: 'Месторождение',
      size: 220,
      cell: ({ row }) => text(row.original?.mestNm),
    },
    {
      ...sizing,
      id: 'well_tehmesto',
      accessorKey: 'tehmesto',
      header: 'Тех. место',
      size: 180,
      cell: ({ row }) => text(row.original?.tehmesto),
    },
    {
      ...sizing,
      id: 'well_code',
      accessorKey: 'wellId',
      header: 'Код скважины',
      size: 130,
      cell: ({ row }) => showId(row.original?.wellId),
    },
  ]
}
