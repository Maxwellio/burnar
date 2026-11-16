import { useEffect, useMemo, useRef, useState } from 'react'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import DialogActions from '@mui/material/DialogActions'
import DialogContent from '@mui/material/DialogContent'
import DialogTitle from '@mui/material/DialogTitle'
import Menu from '@mui/material/Menu'
import MenuItem from '@mui/material/MenuItem'
import Typography from '@mui/material/Typography'
import ArrowDropDown from '@mui/icons-material/ArrowDropDown'
import NoteAdd from '@mui/icons-material/NoteAdd'
import PlaylistAdd from '@mui/icons-material/PlaylistAdd'
import UnfoldLess from '@mui/icons-material/UnfoldLess'
import UnfoldMore from '@mui/icons-material/UnfoldMore'
import { LocalizationProvider } from '@mui/x-date-pickers'
import { DesktopDatePicker } from '@mui/x-date-pickers/DesktopDatePicker'
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns'
import { ruRU } from '@mui/x-date-pickers/locales'
import { ru } from 'date-fns/locale'
import { AxiosProvider, BaseTreeTable } from 'mainComponent'
import { insertNaryadCatalog } from '../api/naryadyApi.js'
import { fetchTematicRazdel } from '../api/tematicRazdelsApi.js'
import DraggableDialog from '../components/DraggableDialog'
import { useAlert, useChoose } from '../context/ConfirmContext.jsx'
import {
  catalogTreeKeepMounted,
  nextCatalogHasOpened,
} from './catalogDialogState.js'
import {
  CATALOG_EMPTY_BLOCK_MESSAGE,
  canInsertFromCatalog,
  catalogDateFromPicker,
  catalogDateToPicker,
  catalogPlaceChoices,
  catalogTreeEmpty,
  defaultCatalogDateIso,
  needsEmptyBlockPlacePrompt,
  normalizeCatalogPlace,
} from './catalogInsertRules.js'
import {
  applyCatalogFilterChange,
  buildCatalogTableFilters,
} from './catalogTreeFilters.js'
import { tematicRazdelColumns } from './tematicRazdelColumns.jsx'

const buttonOutlinedSx = {
  textTransform: 'none',
  bgcolor: 'background.paper',
  borderColor: 'divider',
  color: 'text.secondary',
}

const insertButtonSx = {
  ...buttonOutlinedSx,
  pr: 0.5,
}

/**
 * @param {object} props
 * @param {boolean} props.open
 * @param {() => void} props.onClose
 * @param {string|number} [props.naryadId]
 * @param {object} [props.zadanieTarget] { selectedIds, structureById, closed }
 * @param {object} [props.vipolnenieTarget] { selectedIds, structureById, closed, available }
 * @param {(partId: 'zadanie'|'vipolnenie') => void} [props.onInserted]
 */
export default function CatalogDialog({
  open,
  onClose,
  naryadId,
  zadanieTarget = null,
  vipolnenieTarget = null,
  onInserted,
}) {
  const showAlert = useAlert()
  const choose = useChoose()
  const [hasOpened, setHasOpened] = useState(false)
  const [catalogNode, setCatalogNode] = useState(null)
  const [dateIn, setDateIn] = useState(() => defaultCatalogDateIso())
  const [pending, setPending] = useState(false)
  const [menu, setMenu] = useState(null)
  const [filters, setFilters] = useState([])
  const [expandToken, setExpandToken] = useState(null)
  const [filterEpoch, setFilterEpoch] = useState(0)
  const filtersRef = useRef(filters)
  const expandTokenRef = useRef(expandToken)
  const selectSeq = useRef(0)
  filtersRef.current = filters
  expandTokenRef.current = expandToken

  if (nextCatalogHasOpened(hasOpened, open) !== hasOpened) {
    setHasOpened(true)
  }

  useEffect(() => {
    if (open) setDateIn((prev) => prev || defaultCatalogDateIso())
  }, [open])

  const tableFilters = useMemo(
    () => buildCatalogTableFilters(filters, expandToken),
    [filters, expandToken, filterEpoch],
  )

  const handleSetFilters = (updater) => {
    const result = applyCatalogFilterChange({
      prevFilters: filtersRef.current,
      expandToken: expandTokenRef.current,
      updater,
    })
    setExpandToken(result.expandToken)
    setFilters(result.filters)
  }

  const handleSelectCatalog = (id) => {
    const seq = ++selectSeq.current
    if (id == null || id === '') {
      setCatalogNode(null)
      return
    }
    setCatalogNode({ id: Number(id) })
    fetchTematicRazdel(id)
      .then((node) => {
        if (selectSeq.current !== seq) return
        setCatalogNode(node)
      })
      .catch(() => {
        if (selectSeq.current !== seq) return
        setCatalogNode({ id: Number(id), oper: null })
      })
  }

  const runInsert = async (partId, mode, place) => {
    const target = partId === 'zadanie' ? zadanieTarget : vipolnenieTarget
    const structureById = target?.structureById
    const treeEmpty = catalogTreeEmpty(structureById)
    const selectedIds = target?.selectedIds
    const anchorId = Array.isArray(selectedIds) && selectedIds.length === 1
      ? Number(selectedIds[0])
      : null
    const anchorNode = anchorId != null && structureById instanceof Map
      ? structureById.get(anchorId)
      : null
    const anchor = anchorId == null ? null : { id: anchorId, node: anchorNode }
    let resolved = normalizeCatalogPlace(place)
    if (needsEmptyBlockPlacePrompt(resolved, anchor, treeEmpty)) {
      const picked = await choose(CATALOG_EMPTY_BLOCK_MESSAGE, {
        title: 'Внимание!',
        confirmLabel: 'Внутрь блока',
        confirmResult: 'inside',
        alternateLabel: 'Перед блоком',
        alternateResult: 'before',
        cancelLabel: 'Отмена',
      })
      if (picked !== 'inside' && picked !== 'before') return
      resolved = picked
    }
    setPending(true)
    try {
      await insertNaryadCatalog(naryadId, partId, {
        razdelId: Number(catalogNode.id),
        dateIn,
        place: resolved,
        mode,
        anchorNodeId: treeEmpty ? null : anchorId,
      })
      onInserted?.(partId)
    } catch (error) {
      await showAlert(error?.message || 'Не удалось добавить из каталога')
    } finally {
      setPending(false)
    }
  }

  const openPlaceMenu = (event, action) => {
    setMenu({
      anchorEl: event.currentTarget,
      partId: action.partId,
      mode: action.mode,
      refuseLocked: action.refuseLocked,
      target: action.partId === 'zadanie' ? zadanieTarget : vipolnenieTarget,
    })
  }

  const menuTarget = menu?.target
  const menuTreeEmpty = catalogTreeEmpty(menuTarget?.structureById)
  const menuAnchorId = Array.isArray(menuTarget?.selectedIds) && menuTarget.selectedIds.length === 1
    ? Number(menuTarget.selectedIds[0])
    : null
  const menuAnchor = menuAnchorId == null
    ? null
    : {
        id: menuAnchorId,
        node: menuTarget?.structureById instanceof Map
          ? menuTarget.structureById.get(menuAnchorId)
          : null,
      }
  const placeItems = menu
    ? catalogPlaceChoices({
        treeEmpty: menuTreeEmpty,
        anchor: menuAnchor,
        refuseLocked: menu.refuseLocked,
      })
    : []

  const insertActions = [
    {
      key: 'full-zad',
      label: 'В задание',
      partId: 'zadanie',
      mode: 'full',
      icon: <PlaylistAdd fontSize="small" />,
      refuseLocked: false,
      hasPart: true,
      closed: zadanieTarget?.closed,
      selectedIds: zadanieTarget?.selectedIds,
      structureById: zadanieTarget?.structureById,
    },
    {
      key: 'full-vip',
      label: 'В выполнение',
      partId: 'vipolnenie',
      mode: 'full',
      icon: <PlaylistAdd fontSize="small" />,
      refuseLocked: true,
      hasPart: vipolnenieTarget?.available === true,
      closed: vipolnenieTarget?.closed,
      selectedIds: vipolnenieTarget?.selectedIds,
      structureById: vipolnenieTarget?.structureById,
    },
    {
      key: 'empty-zad',
      label: 'Пустой раздел → задание',
      partId: 'zadanie',
      mode: 'empty',
      icon: <NoteAdd fontSize="small" />,
      refuseLocked: false,
      hasPart: true,
      closed: zadanieTarget?.closed,
      selectedIds: zadanieTarget?.selectedIds,
      structureById: zadanieTarget?.structureById,
    },
    {
      key: 'empty-vip',
      label: 'Пустой раздел → выполнение',
      partId: 'vipolnenie',
      mode: 'empty',
      icon: <NoteAdd fontSize="small" />,
      refuseLocked: true,
      hasPart: vipolnenieTarget?.available === true,
      closed: vipolnenieTarget?.closed,
      selectedIds: vipolnenieTarget?.selectedIds,
      structureById: vipolnenieTarget?.structureById,
    },
  ]

  return (
    <DraggableDialog
      open={open}
      onClose={onClose}
      modeless
      keepMounted={catalogTreeKeepMounted(hasOpened)}
      maxWidth="lg"
      fullWidth
      PaperProps={{ sx: { height: '80vh' } }}
    >
      <DialogTitle>Каталог</DialogTitle>
      <DialogContent
        dividers
        sx={{
          display: 'flex',
          flexDirection: 'column',
          gap: 1.5,
          minHeight: 0,
          overflow: 'hidden',
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
          <LocalizationProvider
            dateAdapter={AdapterDateFns}
            adapterLocale={ru}
            localeText={ruRU.components.MuiLocalizationProvider.defaultProps.localeText}
          >
            <DesktopDatePicker
              label="Дата выполнения операции"
              value={catalogDateToPicker(dateIn)}
              onChange={(next) => setDateIn(catalogDateFromPicker(next))}
              format="dd.MM.yyyy"
              views={['year', 'month', 'day']}
              minDate={new Date(2000, 0, 1)}
              maxDate={new Date(2101, 0, 1)}
              slotProps={{
                textField: {
                  size: 'small',
                  sx: { width: 220 },
                  InputLabelProps: { shrink: true },
                },
              }}
            />
          </LocalizationProvider>
          {insertActions.map((action) => {
            const treeEmpty = catalogTreeEmpty(action.structureById)
            const selectedIds = action.selectedIds
            const anchorId = Array.isArray(selectedIds) && selectedIds.length === 1
              ? Number(selectedIds[0])
              : null
            const anchor = anchorId == null
              ? null
              : {
                  id: anchorId,
                  node: action.structureById instanceof Map
                    ? action.structureById.get(anchorId)
                    : null,
                }
            const enabled = canInsertFromCatalog({
              dateIn,
              catalogNode,
              mode: action.mode,
              partClosed: action.closed,
              hasPart: action.hasPart,
              pending,
              treeEmpty,
              anchor,
            })
            return (
              <Button
                key={action.key}
                variant="outlined"
                disabled={!enabled}
                startIcon={action.icon}
                endIcon={<ArrowDropDown />}
                sx={insertButtonSx}
                onClick={(event) => openPlaceMenu(event, action)}
              >
                {action.label}
              </Button>
            )
          })}
        </Box>
        {!dateIn ? (
          <Typography variant="caption" color="error" sx={{ mt: -1 }}>
            Укажите дату выполнения операции
          </Typography>
        ) : null}
        <Box sx={{ flex: 1, minHeight: 0, minWidth: 0, overflow: 'hidden' }}>
          {hasOpened ? (
            <AxiosProvider baseapi="/api">
              <BaseTreeTable
                url="/tematic-razdels"
                columns={tematicRazdelColumns}
                filters={tableFilters}
                setFilters={handleSetFilters}
                setSelectedId={handleSelectCatalog}
                initialState={{ pagination: { pageIndex: 0, pageSize: 10000 } }}
              />
            </AxiosProvider>
          ) : null}
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} sx={{ textTransform: 'none' }}>
          Закрыть
        </Button>
      </DialogActions>
      <Menu
        anchorEl={menu?.anchorEl}
        open={Boolean(menu)}
        onClose={() => setMenu(null)}
      >
        {placeItems.map((item) => (
          <MenuItem
            key={item.result}
            onClick={() => {
              const current = menu
              setMenu(null)
              if (!current) return
              void runInsert(current.partId, current.mode, item.result)
            }}
          >
            {item.label}
          </MenuItem>
        ))}
      </Menu>
    </DraggableDialog>
  )
}
