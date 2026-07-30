const formatIntegerCode = (value) => {
  if (value == null || value === '') {
    return ''
  }

  const numericValue = Number(value)
  return Number.isFinite(numericValue) ? String(Math.trunc(numericValue)) : ''
}

// Видимые поля повторяют read-only представление тематического каталога в Delphi.
export const thematicCatalogColumns = [
  {
    accessorKey: 'id',
    header: 'Код раздела',
    size: 120,
    cell: ({ getValue }) => formatIntegerCode(getValue()),
  },
  {
    accessorKey: 'name',
    header: 'Наименование',
    size: 420,
  },
  {
    accessorKey: 'operationId',
    header: 'Код операции',
    size: 140,
    cell: ({ getValue }) => formatIntegerCode(getValue()),
  },
]
