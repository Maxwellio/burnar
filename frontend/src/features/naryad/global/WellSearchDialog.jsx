import { useCallback, useEffect, useState } from 'react'
import Alert from '@mui/material/Alert'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import CircularProgress from '@mui/material/CircularProgress'
import DialogActions from '@mui/material/DialogActions'
import DialogContent from '@mui/material/DialogContent'
import DialogTitle from '@mui/material/DialogTitle'
import IconButton from '@mui/material/IconButton'
import Table from '@mui/material/Table'
import TableBody from '@mui/material/TableBody'
import TableCell from '@mui/material/TableCell'
import TableHead from '@mui/material/TableHead'
import TableRow from '@mui/material/TableRow'
import TextField from '@mui/material/TextField'
import Tooltip from '@mui/material/Tooltip'
import Typography from '@mui/material/Typography'
import Close from '@mui/icons-material/Close'
import { refreshWellsByTehmesto, searchWells } from '../../../api/naryadyApi.js'
import DraggableDialog from '../../../components/DraggableDialog'
import { useAlert, useConfirm } from '../../../context/ConfirmContext.jsx'
import {
  REFRESH_CONFIRM_MESSAGE,
  TEHMESTO_TOO_SHORT_MESSAGE,
  markChosen,
  refreshDoneMessage,
  searchSeed,
  shouldSearchOnOpen,
  tehmestoRefreshable,
} from './wellSearchRules.js'

const DIALOG_WIDTH = 1080

const COLUMNS = [
  { key: 'number', label: '№', width: 88 },
  { key: 'wellLabel', label: 'Скважина', width: 140 },
  { key: 'kustLabel', label: 'Куст', width: 120 },
  { key: 'mestNm', label: 'Месторождение' },
  { key: 'tehmesto', label: 'Тех. место', width: 180 },
  { key: 'wellId', label: 'Код скважины', width: 130 },
]

/**
 * Поиск и выбор скважины (Delphi SkvFind). Размер как у общих параметров.
 * Выбор возвращает строку родителю и не пишет в базу.
 */
export default function WellSearchDialog({ rows, draft, onClose, onSelect }) {
  const confirm = useConfirm()
  const showAlert = useAlert()
  const seed = searchSeed(rows, draft)
  const [skv, setSkv] = useState(seed.skv)
  const [mest, setMest] = useState(seed.mest)
  const [kust, setKust] = useState(seed.kust)
  const [tehmesto, setTehmesto] = useState('')
  const [results, setResults] = useState([])
  const [selected, setSelected] = useState(-1)
  const [searching, setSearching] = useState(() => shouldSearchOnOpen(seed))
  const [searched, setSearched] = useState(false)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState('')

  const runSearch = useCallback(async (criteria, wellId) => {
    setSearching(true)
    setError('')
    try {
      const found = markChosen(await searchWells(criteria), wellId)
      setResults(found)
      const chosen = found.findIndex((row) => row.number === 'Выбрана')
      setSelected(chosen >= 0 ? chosen : (found.length > 0 ? 0 : -1))
      return true
    } catch (searchError) {
      setResults([])
      setSelected(-1)
      setError(searchError?.message || 'Не удалось найти скважины')
      return false
    } finally {
      setSearched(true)
      setSearching(false)
    }
  }, [])

  useEffect(() => {
    if (shouldSearchOnOpen(seed)) {
      void runSearch(
        { skv: seed.skv, mest: seed.mest, kust: seed.kust, tehmesto: '' },
        seed.wellId,
      )
    }
    // Поиск при открытии один раз, по значениям наряда на этот момент.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const choose = (index) => {
    const row = results[index]
    if (!row || searching || refreshing) return
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
    if (searching || refreshing) return
    void runSearch({ skv, mest, kust, tehmesto }, seed.wellId)
  }

  const handleRefresh = async () => {
    if (searching || refreshing) return
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
      const found = await runSearch({ skv, mest, kust, tehmesto }, seed.wellId)
      if (found) await showAlert(refreshDoneMessage(tehmesto))
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

  const busy = searching || refreshing

  return (
    <DraggableDialog
      open
      onClose={busy ? undefined : onClose}
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
          <IconButton aria-label="Закрыть" onClick={onClose} disabled={busy}>
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
              disabled={busy}
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
            disabled={busy}
            InputLabelProps={{ shrink: true }}
          />
          <TextField
            label="Месторождение"
            value={mest}
            onChange={(event) => setMest(event.target.value)}
            onKeyDown={onFieldKeyDown}
            size="small"
            fullWidth
            disabled={busy}
            InputLabelProps={{ shrink: true }}
          />
          <TextField
            label="Куст"
            value={kust}
            onChange={(event) => setKust(event.target.value)}
            onKeyDown={onFieldKeyDown}
            size="small"
            fullWidth
            disabled={busy}
            InputLabelProps={{ shrink: true }}
          />
        </Box>
        <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
          <Button
            type="button"
            variant="outlined"
            size="small"
            onClick={handleSearch}
            disabled={busy}
            startIcon={searching ? <CircularProgress size={14} color="inherit" /> : null}
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
                disabled={busy}
                startIcon={refreshing ? <CircularProgress size={14} color="inherit" /> : null}
              >
                Обновить данные по техместу
              </Button>
            </span>
          </Tooltip>
        </Box>
        {error ? <Alert severity="error">{error}</Alert> : null}
        <Box sx={{ flex: 1, minHeight: 0, overflow: 'auto', border: '1px solid', borderColor: 'divider', borderRadius: 1 }}>
          <Table size="small" stickyHeader>
            <TableHead>
              <TableRow>
                {COLUMNS.map((column) => (
                  <TableCell key={column.key} sx={{ width: column.width, fontWeight: 700 }}>
                    {column.label}
                  </TableCell>
                ))}
              </TableRow>
            </TableHead>
            <TableBody>
              {results.map((row, index) => {
                const active = index === selected
                return (
                  <TableRow
                    key={`${row.wellId}-${row.kustId}-${row.mestId}-${index}`}
                    hover
                    selected={active}
                    tabIndex={active ? 0 : -1}
                    onClick={() => setSelected(index)}
                    onDoubleClick={() => choose(index)}
                    onKeyDown={(event) => {
                      if (event.key === 'Enter') {
                        event.preventDefault()
                        choose(index)
                      }
                    }}
                    sx={{ cursor: 'pointer' }}
                  >
                    {COLUMNS.map((column) => (
                      <TableCell key={column.key}>{row[column.key] ?? ''}</TableCell>
                    ))}
                  </TableRow>
                )
              })}
              {searched && !searching && results.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={COLUMNS.length} sx={{ color: 'text.secondary' }}>
                    Скважины не найдены
                  </TableCell>
                </TableRow>
              ) : null}
            </TableBody>
          </Table>
        </Box>
      </DialogContent>
      <DialogActions sx={{ px: 3, py: 1.5 }}>
        <Button
          variant="contained"
          disableElevation
          onClick={() => choose(selected)}
          disabled={busy || selected < 0}
        >
          Выбрать
        </Button>
        <Button variant="outlined" color="inherit" onClick={onClose} disabled={busy}>
          Закрыть
        </Button>
      </DialogActions>
    </DraggableDialog>
  )
}
