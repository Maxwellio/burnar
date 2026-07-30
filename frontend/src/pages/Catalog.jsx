import { useEffect, useState } from 'react'
import Alert from '@mui/material/Alert'
import Box from '@mui/material/Box'
import CircularProgress from '@mui/material/CircularProgress'
import IconButton from '@mui/material/IconButton'
import Typography from '@mui/material/Typography'
import ChevronRightIcon from '@mui/icons-material/ChevronRight'
import ExpandMoreIcon from '@mui/icons-material/ExpandMore'
import { AxiosProvider, BaseTreeTable, useApi } from 'mainComponent'

const CATALOG_URL = '/thematic-catalog'

/**
 * Axios после request-интерцептора переписывает config.url в полный путь
 * (`/thematic-catalog` → `/api/thematic-catalog`), поэтому точное `===` ломает
 * снятие loading/error и оставляет спиннер навсегда.
 */
function isCatalogRequest(config) {
  const url = config?.url
  return typeof url === 'string' && url.includes('thematic-catalog')
}

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

/**
 * mainComponent загружает дерево сам и не отдаёт наружу loading/error.
 * Наблюдаем тот же Axios-запрос через интерцепторы, чтобы не дублировать GET каталога.
 */
function CatalogTree() {
  const api = useApi()
  const [requestState, setRequestState] = useState({
    loading: true,
    error: null,
    empty: false,
  })

  useEffect(() => {
    const requestId = api.interceptors.request.use((config) => {
      if (isCatalogRequest(config)) {
        setRequestState({ loading: true, error: null, empty: false })
      }
      return config
    })
    const responseId = api.interceptors.response.use(
      (response) => {
        if (isCatalogRequest(response.config)) {
          setRequestState({
            loading: false,
            error: null,
            empty: Array.isArray(response.data) && response.data.length === 0,
          })
        }
        return response
      },
      (error) => {
        if (isCatalogRequest(error.config)) {
          const status = error.response?.status
          setRequestState({
            loading: false,
            error:
              status === 404
                ? 'Эндпоинт /api/thematic-catalog не найден — перезапустите backend с актуальным кодом'
                : 'Не удалось загрузить тематический каталог',
            empty: false,
          })
        }
        return Promise.reject(error)
      },
    )

    return () => {
      api.interceptors.request.eject(requestId)
      api.interceptors.response.eject(responseId)
    }
  }, [api])

  return (
    <Box sx={{ p: 2, height: '100%', boxSizing: 'border-box' }}>
      <Typography variant="h6" gutterBottom>
        Тематический каталог
      </Typography>
      {requestState.error ? (
        <Alert severity="error" sx={{ mb: 2 }}>
          {requestState.error}
        </Alert>
      ) : null}
      {requestState.empty ? (
        <Typography color="text.secondary" sx={{ mb: 2 }}>
          В тематическом каталоге нет доступных разделов
        </Typography>
      ) : null}
      <Box sx={{ position: 'relative', minHeight: 120 }}>
        <BaseTreeTable
          url={CATALOG_URL}
          columns={catalogColumns}
          loadMode="full"
        />
        {requestState.loading ? (
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

/** Страница /catalog: ACL-дерево тематических разделов из одного GET-запроса. */
export default function Catalog() {
  return (
    <AxiosProvider baseapi="/api">
      <CatalogTree />
    </AxiosProvider>
  )
}
