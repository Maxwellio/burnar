import { useEffect, useState } from 'react'
import {
  flexRender,
  getCoreRowModel,
  getExpandedRowModel,
  useReactTable,
} from '@tanstack/react-table'
import Alert from '@mui/material/Alert'
import Box from '@mui/material/Box'
import CircularProgress from '@mui/material/CircularProgress'
import IconButton from '@mui/material/IconButton'
import Typography from '@mui/material/Typography'
import ChevronRightIcon from '@mui/icons-material/ChevronRight'
import ExpandMoreIcon from '@mui/icons-material/ExpandMore'
import { fetchThematicCatalog } from '../api/thematicCatalogApi.js'

/**
 * Не используем BaseTreeTable для загрузки: в mainComponent по умолчанию lazy
 * и жёсткий rootId 1000242 → GET /api/thematic-catalog/1000242 (404).
 * loadMode="full" легко теряется из‑за кэша Vite optimizeDeps у file:-пакета.
 * Тот же session-cookie путь, что у остального SPA (http.js).
 */
const catalogColumns = [
  {
    accessorKey: 'id',
    header: 'Код раздела',
    cell: ({ row, getValue }) => (
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          pl: row.depth * 2,
        }}
      >
        {row.getCanExpand() ? (
          <IconButton
            aria-label={row.getIsExpanded() ? 'Свернуть раздел' : 'Раскрыть раздел'}
            size="small"
            onClick={(event) => {
              event.stopPropagation()
              row.getToggleExpandedHandler()(event)
            }}
          >
            {row.getIsExpanded() ? <ExpandMoreIcon /> : <ChevronRightIcon />}
          </IconButton>
        ) : (
          <Box sx={{ width: 34, flexShrink: 0 }} />
        )}
        {getValue()}
      </Box>
    ),
  },
  {
    accessorKey: 'name',
    header: 'Наименование',
  },
  {
    accessorKey: 'operKey',
    header: 'Код операции',
    cell: ({ getValue }) => getValue() ?? '—',
  },
]

/** Страница /catalog: ACL-дерево тематических разделов из одного GET-запроса. */
export default function Catalog() {
  const [data, setData] = useState([])
  const [expanded, setExpanded] = useState({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    setError(null)
    fetchThematicCatalog()
      .then((tree) => {
        if (cancelled) return
        setData(Array.isArray(tree) ? tree : [])
        setLoading(false)
      })
      .catch(() => {
        if (cancelled) return
        setData([])
        setError('Не удалось загрузить тематический каталог')
        setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [])

  const table = useReactTable({
    data,
    columns: catalogColumns,
    state: { expanded },
    onExpandedChange: setExpanded,
    getCoreRowModel: getCoreRowModel(),
    getExpandedRowModel: getExpandedRowModel(),
    getSubRows: (row) => row.children,
    getRowCanExpand: (row) =>
      row.original.hasChildren ?? (row.subRows?.length ?? 0) > 0,
  })

  return (
    <Box sx={{ p: 2, height: '100%', boxSizing: 'border-box' }}>
      <Typography variant="h6" gutterBottom>
        Тематический каталог
      </Typography>
      {error ? (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      ) : null}
      {!loading && !error && data.length === 0 ? (
        <Typography color="text.secondary" sx={{ mb: 2 }}>
          В тематическом каталоге нет доступных разделов
        </Typography>
      ) : null}
      <Box sx={{ position: 'relative', minHeight: 120, overflow: 'auto' }}>
        <Box
          component="table"
          sx={{
            width: '100%',
            borderCollapse: 'collapse',
            '& th, & td': {
              border: '1px solid',
              borderColor: 'divider',
              px: 1.5,
              py: 1,
              textAlign: 'left',
              fontSize: '0.875rem',
            },
            '& th': {
              bgcolor: '#F0F4FF',
              color: '#364FC7',
              fontWeight: 500,
            },
            '& tbody tr:hover': {
              bgcolor: '#E7F0FF',
            },
          }}
        >
          <thead>
            {table.getHeaderGroups().map((headerGroup) => (
              <tr key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <th key={header.id}>
                    {flexRender(
                      header.column.columnDef.header,
                      header.getContext(),
                    )}
                  </th>
                ))}
              </tr>
            ))}
          </thead>
          <tbody>
            {table.getRowModel().rows.map((row) => (
              <tr key={row.id}>
                {row.getVisibleCells().map((cell) => (
                  <td key={cell.id}>
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </Box>
        {loading ? (
          <Box
            sx={{
              position: 'absolute',
              inset: 0,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              bgcolor: 'rgba(255, 255, 255, 0.72)',
            }}
          >
            <CircularProgress size={28} />
          </Box>
        ) : null}
      </Box>
    </Box>
  )
}
