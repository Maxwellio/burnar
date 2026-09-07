import { useMemo, useRef, useState } from 'react'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import UnfoldLess from '@mui/icons-material/UnfoldLess'
import UnfoldMore from '@mui/icons-material/UnfoldMore'
import { AxiosProvider, BaseTreeTable } from 'mainComponent'
import { tematicRazdelColumns } from './tematicRazdelColumns.jsx'

const buttonOutlinedSx = {
  textTransform: 'none',
  bgcolor: 'background.paper',
  borderColor: 'divider',
  color: 'text.secondary',
}

/** Скрытый filter: уходит в GET как expandAll, колонки с таким id нет. */
const EXPAND_ALL_FILTER_ID = 'expandAll'

const isActiveColumnFilter = (filter) =>
  filter.id !== EXPAND_ALL_FILTER_ID &&
  filter.value != null &&
  String(filter.value).trim() !== ''

/**
 * Каталог тематических разделов (Delphi TfrmStructNar, read-only).
 * Дерево от id=2: GET /api/tematic-razdels и /{id}/children через BaseTreeTable.
 * selectedId держим для будущих кнопок вставки в наряд.
 * «Раскрыть все» — GET с expandAll (полный лес) + auto-expand пакета.
 * «Свернуть все» — новая ссылка filters, без refetch; дети остаются в памяти.
 * Сброс колоночных фильтров снимает expandAll, иначе пакет снова раскроет весь лес.
 */
export default function Catalog() {
  const [selectedId, setSelectedId] = useState(null)
  const [filters, setFilters] = useState([])
  const [expandToken, setExpandToken] = useState(null)
  const [filterEpoch, setFilterEpoch] = useState(0)
  const filtersRef = useRef(filters)
  const expandTokenRef = useRef(expandToken)
  filtersRef.current = filters
  expandTokenRef.current = expandToken

  const tableFilters = useMemo(() => {
    return expandToken == null
      ? [...filters]
      : [...filters, { id: EXPAND_ALL_FILTER_ID, value: String(expandToken) }]
  }, [filters, expandToken, filterEpoch])

  const handleSetFilters = (updater) => {
    const prev = filtersRef.current
    const token = expandTokenRef.current
    const current =
      token == null ? prev : [...prev, { id: EXPAND_ALL_FILTER_ID, value: String(token) }]
    const raw = typeof updater === 'function' ? updater(current) : updater
    const next = (raw ?? []).filter((f) => f.id !== EXPAND_ALL_FILTER_ID)
    const hadColumnFilters = prev.some(isActiveColumnFilter)
    const hasColumnFilters = next.some(isActiveColumnFilter)
    if (hadColumnFilters && !hasColumnFilters) {
      setExpandToken(null)
    }
    setFilters(next)
  }

  return (
    <Box
      sx={{
        height: '100%',
        minHeight: 0,
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        p: 2.5,
        boxSizing: 'border-box',
        gap: 2,
      }}
    >
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          gap: 1,
          flexWrap: 'wrap',
          flexShrink: 0,
        }}
      >
        <Button
          variant="outlined"
          startIcon={<UnfoldMore />}
          sx={buttonOutlinedSx}
          onClick={() => setExpandToken((token) => (token ?? 0) + 1)}
        >
          Раскрыть все
        </Button>
        <Button
          variant="outlined"
          startIcon={<UnfoldLess />}
          sx={buttonOutlinedSx}
          onClick={() => setFilterEpoch((epoch) => epoch + 1)}
        >
          Свернуть все
        </Button>
      </Box>
      <Box sx={{ flex: 1, minHeight: 0 }}>
        <AxiosProvider baseapi="/api">
          <BaseTreeTable
            url="/tematic-razdels"
            columns={tematicRazdelColumns}
            filters={tableFilters}
            setFilters={handleSetFilters}
            setSelectedId={setSelectedId}
            initialState={{ pagination: { pageIndex: 0, pageSize: 10000 } }}
          />
        </AxiosProvider>
      </Box>
    </Box>
  )
}
