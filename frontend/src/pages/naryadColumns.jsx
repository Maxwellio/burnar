import Box from '@mui/material/Box'
import LockOutlinedIcon from '@mui/icons-material/LockOutlined'
import LockOpenOutlinedIcon from '@mui/icons-material/LockOpenOutlined'
import { FILTER_TYPES } from 'mainComponent'

/** Иконка закрытия: '1' — закрыт, '0' — открыт, иначе без иконки. */
function CloseLockMark({ closed }) {
  if (closed === '1') {
    return <LockOutlinedIcon fontSize="small" color="action" sx={{ flexShrink: 0 }} />
  }
  if (closed === '0') {
    return <LockOpenOutlinedIcon fontSize="small" color="action" sx={{ flexShrink: 0 }} />
  }
  return null
}

function CellWithLock({ closed, text }) {
  return (
    <Box sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.5, minWidth: 0 }}>
      <CloseLockMark closed={closed} />
      <Box component="span" sx={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>
        {text ?? ''}
      </Box>
    </Box>
  )
}

/**
 * Колонки списка нарядов — заголовки как в Delphi NarListUnit.grdDefNarList.
 * Встроенные фильтры BaseTable: query-параметр = id/accessorKey колонки.
 * Составные: zadClose → begdate на бэке, vipClose → per_vip (getallpervip).
 */
export const naryadColumns = [
  {
    accessorKey: 'codNar',
    header: 'Код',
    size: 70,
    enableColumnFilter: true,
  },
  {
    accessorKey: 'nameNar',
    header: 'Наименование',
    size: 180,
    enableColumnFilter: true,
  },
  {
    accessorKey: 'ownerNar',
    header: 'Бригада',
    size: 220,
    enableColumnFilter: true,
  },
  {
    accessorKey: 'masterNar',
    header: 'Мастер',
    size: 160,
    enableColumnFilter: true,
  },
  {
    // В Delphi в ячейку ZadClose подставляется BegDate + иконка закрытия
    id: 'zadClose',
    header: 'План.Нач.Бур.',
    size: 120,
    enableColumnFilter: true,
    meta: { filterVariant: FILTER_TYPES.DATE },
    accessorFn: (row) => row.begDate ?? '',
    cell: ({ row }) => (
      <CellWithLock closed={row.original.zadClose} text={row.original.begDate} />
    ),
  },
  {
    // В Delphi в ячейку VipClose подставляется PerVip + иконка
    id: 'vipClose',
    header: 'Учетные периоды',
    size: 180,
    enableColumnFilter: true,
    accessorFn: (row) => row.perVip ?? '',
    cell: ({ row }) => (
      <CellWithLock closed={row.original.vipClose} text={row.original.perVip} />
    ),
  },
  {
    accessorKey: 'vipBegDate',
    header: 'Нач.Бур.',
    size: 100,
    enableColumnFilter: true,
    meta: { filterVariant: FILTER_TYPES.DATE },
  },
  {
    accessorKey: 'skv',
    header: 'Скв.',
    size: 80,
    enableColumnFilter: true,
  },
  {
    accessorKey: 'kust',
    header: 'Куст',
    size: 80,
    enableColumnFilter: true,
  },
  {
    accessorKey: 'mest',
    header: 'Мест.',
    size: 120,
    enableColumnFilter: true,
  },
  {
    accessorKey: 'dateCreate',
    header: 'Создан',
    size: 100,
    enableColumnFilter: true,
    meta: { filterVariant: FILTER_TYPES.DATE },
  },
  {
    accessorKey: 'autorNar',
    header: 'Автор',
    size: 120,
    enableColumnFilter: true,
  },
]
