import { useMemo, useRef, useState } from 'react'
import Alert from '@mui/material/Alert'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import CircularProgress from '@mui/material/CircularProgress'
import DialogActions from '@mui/material/DialogActions'
import DialogContent from '@mui/material/DialogContent'
import DialogTitle from '@mui/material/DialogTitle'
import IconButton from '@mui/material/IconButton'
import TextField from '@mui/material/TextField'
import Tooltip from '@mui/material/Tooltip'
import Typography from '@mui/material/Typography'
import Close from '@mui/icons-material/Close'
import { AxiosProvider, BaseTable } from 'mainComponent'
import { refreshWellsByTehmesto } from '../../../api/naryadyApi.js'
import DraggableDialog from '../../../components/DraggableDialog'
import { useAlert, useConfirm } from '../../../context/ConfirmContext.jsx'
import { COLUMN_SIZING_KEYS } from '../naryadPageLayout.js'
import useColumnSizingPersistence from '../workspace/layout/useColumnSizingPersistence.js'
import { wellSearchColumns } from './wellSearchColumns.jsx'
import {
  REFRESH_CONFIRM_MESSAGE,
  TEHMESTO_TOO_SHORT_MESSAGE,
  WELL_SEARCH_URL,
  refreshDoneMessage,
  searchSeed,
  shouldSearchOnOpen,
  tehmestoRefreshable,
  wellSearchFilters,
} from './wellSearchRules.js'

const DIALOG_WIDTH = 1080
const noopSetFilters = () => {}

function initialCriteria(seed) {
  if (!shouldSearchOnOpen(seed)) return null
  return { skv: seed.skv, mest: seed.mest, kust: seed.kust, tehmesto: '' }
}

/**
 * Поиск и выбор скважины (Delphi SkvFind). Размер как у общих параметров.
 * Таблица — BaseTable пакета, как средняя таблица общих параметров.
 * Выбор возвращает строку родителю и не пишет в базу.
 */
export default function WellSearchDialog({ rows, draft, onClose, onSelect }) {
  const confirm = useConfirm()
  const showAlert = useAlert()
  const seed = searchSeed(rows, draft)
  const cacheRef = useRef(new Map())
  const [skv, setSkv] = useState(seed.skv)
  const [mest, setMest] = useState(seed.mest)
  const [kust, setKust] = useState(seed.kust)
  const [tehmesto, setTehmesto] = useState('')
  const [criteria, setCriteria] = useState(() => initialCriteria(seed))
  const [reload, setReload] = useState(0)
  const [selectedId, setSelectedId] = useState(null)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState('')
  const columns = useMemo(() => wellSearchColumns(cacheRef), [])
  const filters = useMemo(
    () => wellSearchFilters(criteria, seed.wellId),
    [criteria, seed.wellId],
  )
  useColumnSizingPersistence([[WELL_SEARCH_URL, COLUMN_SIZING_KEYS.wellSearch]])

  const applySearch = (next) => {
    cacheRef.current = new Map()
    setSelectedId(null)
    setCriteria(next)
    setReload((value) => value + 1)
  }

  const choose = (idArg) => {
    if (refreshing) return
    const id = typeof idArg === 'string' || typeof idArg === 'number' ? idArg : selectedId
    if (id == null) return
    const row = cacheRef.current.get(String(id))
    if (!row) return
    onSelect({
      wellId: row.wellId,
      wellNm: row.wellNm ?? '',
      kustId: row.kustId,
      kustNm: row.kustNm ?? '',
      mestId: row.mestId,
      mestNm: row.mestNm ?? '',
    })
  }

  const handleSearch = () => {
    if (refreshing) return
    applySearch({ skv, mest, kust, tehmesto })
  }

  const handleRefresh = async () => {
    if (refreshing) return
    if (!tehmestoRefreshable(tehmesto)) {
      await showAlert(TEHMESTO_TOO_SHORT_MESSAGE)
      return
    }
    const accepted = await confirm(REFRESH_CONFIRM_MESSAGE, {
      action: 'загрузку',
      confirmLabel: 'Продолжить',
      cancelLabel: 'Отмена',
    })
    if (!accepted) return
    setRefreshing(true)
    setError('')
    try {
      await refreshWellsByTehmesto(tehmesto)
      applySearch({ skv, mest, kust, tehmesto })
      await showAlert(refreshDoneMessage(tehmesto))
    } catch (refreshError) {
      setError(refreshError?.message || 'Не удалось обновить данные по техместу')
    } finally {
      setRefreshing(false)
    }
  }

  const onFieldKeyDown = (event) => {
    if (event.key === 'Enter') {
      event.preventDefault()
      handleSearch()
    }
  }

  return (
    <DraggableDialog
      open
      onClose={refreshing ? undefined : onClose}
      aria-labelledby="well-search-title"
      maxWidth={false}
      PaperProps={{
        sx: {
          width: DIALOG_WIDTH,
          maxWidth: 'calc(100vw - 32px)',
          height: '92vh',
          m: 2,
        },
      }}
    >
      <DialogTitle
        id="well-search-title"
        sx={{ display: 'flex', alignItems: 'center', gap: 1, pr: 1, py: 1.25 }}
      >
        <Typography component="span" variant="h6" sx={{ flex: 1, fontSize: '1.1rem' }}>
          Поиск скважины
        </Typography>
        <Tooltip title="Закрыть">
          <IconButton aria-label="Закрыть" onClick={onClose} disabled={refreshing}>
            <Close />
          </IconButton>
        </Tooltip>
      </DialogTitle>
      <DialogContent
        dividers
        sx={{ display: 'flex', flexDirection: 'column', gap: 1.25, minHeight: 0 }}
      >
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
            gap: 1.25,
            pt: 0.5,
          }}
        >
          <Tooltip title="Поиск по техместу выполняется, если введено больше 4 символов">
            <TextField
              label="Тех. место"
              value={tehmesto}
              onChange={(event) => setTehmesto(event.target.value)}
              onKeyDown={onFieldKeyDown}
              size="small"
              fullWidth
              disabled={refreshing}
              InputLabelProps={{ shrink: true }}
            />
          </Tooltip>
          <TextField
            label="Скважина"
            value={skv}
            onChange={(event) => setSkv(event.target.value)}
            onKeyDown={onFieldKeyDown}
            size="small"
            fullWidth
            disabled={refreshing}
            InputLabelProps={{ shrink: true }}
          />
          <TextField
            label="Месторождение"
            value={mest}
            onChange={(event) => setMest(event.target.value)}
            onKeyDown={onFieldKeyDown}
            size="small"
            fullWidth
            disabled={refreshing}
            InputLabelProps={{ shrink: true }}
          />
          <TextField
            label="Куст"
            value={kust}
            onChange={(event) => setKust(event.target.value)}
            onKeyDown={onFieldKeyDown}
            size="small"
            fullWidth
            disabled={refreshing}
            InputLabelProps={{ shrink: true }}
          />
        </Box>
        <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
          <Button
            type="button"
            variant="outlined"
            size="small"
            onClick={handleSearch}
            disabled={refreshing}
          >
            Поиск
          </Button>
          <Tooltip title="Загрузка данных из ИС Бурение по указанному тех. месту">
            <span>
              <Button
                type="button"
                variant="outlined"
                size="small"
                onClick={() => { void handleRefresh() }}
                disabled={refreshing}
                startIcon={refreshing ? <CircularProgress size={14} color="inherit" /> : null}
              >
                Обновить данные по техместу
              </Button>
            </span>
          </Tooltip>
        </Box>
        {error ? <Alert severity="error">{error}</Alert> : null}
        <Box
          sx={{
            flex: 1,
            minHeight: 0,
            minWidth: 0,
            width: '100%',
            overflow: 'hidden',
            display: 'flex',
            flexDirection: 'column',
            '& .overflow-y-auto': { overflowX: 'auto' },
            '& td, & th': {
              whiteSpace: 'normal !important',
              textOverflow: 'clip !important',
              overflowWrap: 'anywhere',
            },
          }}
        >
          <AxiosProvider baseapi="/api">
            <BaseTable
              url={WELL_SEARCH_URL}
              columns={columns}
              filters={filters}
              setFilters={noopSetFilters}
              setSelectedId={setSelectedId}
              handleDoubleClick={choose}
              reRenderSignal={reload}
              style={{ flex: 1, minWidth: 0, minHeight: 0, width: '100%' }}
            />
          </AxiosProvider>
        </Box>
      </DialogContent>
      <DialogActions sx={{ px: 3, py: 1.5 }}>
        <Button
          variant="contained"
          disableElevation
          onClick={() => choose(selectedId)}
          disabled={refreshing || selectedId == null}
        >
          Выбрать
        </Button>
        <Button variant="outlined" color="inherit" onClick={onClose} disabled={refreshing}>
          Закрыть
        </Button>
      </DialogActions>
    </DraggableDialog>
  )
}
