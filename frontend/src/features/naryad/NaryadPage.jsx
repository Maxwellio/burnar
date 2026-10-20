import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import Box from '@mui/material/Box'
import IconButton from '@mui/material/IconButton'
import ToggleButton from '@mui/material/ToggleButton'
import ToggleButtonGroup from '@mui/material/ToggleButtonGroup'
import Tooltip from '@mui/material/Tooltip'
import Typography from '@mui/material/Typography'
import Close from '@mui/icons-material/Close'
import HorizontalSplit from '@mui/icons-material/HorizontalSplit'
import MenuBook from '@mui/icons-material/MenuBook'
import Tune from '@mui/icons-material/Tune'
import VerticalSplit from '@mui/icons-material/VerticalSplit'
import { fetchNaryadHeader } from '../../api/naryadyApi.js'
import CatalogDialog from '../../pages/CatalogDialog.jsx'
import NaryadWorkspacePanel from './workspace/NaryadWorkspacePanel.jsx'
import { vipolneniePart } from './parts/vipolneniePart.js'
import { zadaniePart } from './parts/zadaniePart.js'
import SkvParamsWindows from './skv/SkvParamsWindows.jsx'
import useSkvWindows from './skv/useSkvWindows.js'
import {
  ACTION_BAR_HEIGHT,
  readStoredSplitOrientation,
  writeStoredSplitOrientation,
} from './naryadPageLayout.js'
import { PANEL_ORDER, initialOpenPanels, isVipolneniePanelEnabled, toggleOpenPanels } from './naryadTabs.js'

/** Вкладки карточки наряда — Delphi TfrmComNarZad / TfrmComNarVip. */
const PANELS = [
  { value: 'zad', label: 'Задание' },
  { value: 'vip', label: 'Выполнение' },
]

const PARTS_BY_ID = {
  [zadaniePart.id]: zadaniePart,
  [vipolneniePart.id]: vipolneniePart,
}

const toggleGroupSx = {
  alignSelf: 'stretch',
  height: '100%',
  '& .MuiToggleButtonGroup-grouped': {
    margin: 0,
    borderRadius: '0 !important',
    height: '100%',
    borderTop: 'none',
    borderBottom: 'none',
  },
  '& .MuiToggleButtonGroup-grouped:not(:first-of-type)': {
    marginLeft: 0,
    borderLeft: '1px solid',
    borderColor: 'divider',
  },
    '& .MuiToggleButton-root': {
    height: '100%',
    px: 2.5,
    py: 0,
    textTransform: 'none',
    color: 'text.primary',
    borderColor: 'divider',
    borderRadius: 0,
    '&.Mui-disabled': {
      color: 'text.disabled',
      borderColor: 'divider',
    },
  },
  '& .MuiToggleButton-root.Mui-selected': {
    color: '#1976d2',
    backgroundColor: '#D0EBFF',
    '&:hover': {
      backgroundColor: '#B1D7FF',
    },
  },
}

const stubIconSx = {
  height: '100%',
  width: ACTION_BAR_HEIGHT,
  borderRadius: 0,
  borderLeft: 1,
  borderColor: 'divider',
  color: 'text.secondary',
}

const splitButtonSx = {
  height: '100%',
  width: ACTION_BAR_HEIGHT,
  borderRadius: 0,
  borderLeft: 1,
  borderRight: 1,
  borderColor: 'divider',
  color: 'text.secondary',
  '&.Mui-disabled': {
    color: 'text.disabled',
    borderColor: 'action.disabled',
  },
}

function paneSx(visible, bothOpen, dividerSide) {
  return {
    display: visible ? 'flex' : 'none',
    flexDirection: 'column',
    flex: bothOpen ? '1 1 50%' : '1 1 100%',
    minWidth: 0,
    minHeight: 0,
    overflow: 'hidden',
    ...(dividerSide === 'right'
      ? { borderRight: 1, borderColor: 'divider' }
      : null),
    ...(dividerSide === 'bottom'
      ? { borderBottom: 1, borderColor: 'divider' }
      : null),
  }
}

/**
 * Карточка наряда /naryad/:id.
 * Action bar: включаемые вкладки (повторный клик по единственной переключает
 * на другую, если она есть), кнопка деления, подпись наряда,
 * заглушка параметров, модальный каталог и выход на список.
 * Обе вкладки при включении делят область пополам: слева-направо или
 * сверху-вниз. Направление хранится в localStorage. Панели остаются
 * смонтированными при скрытии, чтобы ширины колонок сохранялись.
 */
export default function NaryadPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [openPanels, setOpenPanels] = useState([])
  const [mountedPanels, setMountedPanels] = useState({ zad: false, vip: false })
  const [splitOrientation, setSplitOrientation] = useState(readStoredSplitOrientation)
  const [nameNar, setNameNar] = useState('')
  const [zadanieClosed, setZadanieClosed] = useState(null)
  const [vipolnenieClosed, setVipolnenieClosed] = useState(null)
  const [hasZadanie, setHasZadanie] = useState(false)
  const [hasVipolnenie, setHasVipolnenie] = useState(false)
  const [zadanieReloadSignal, setZadanieReloadSignal] = useState(0)
  const [vipolnenieReloadSignal, setVipolnenieReloadSignal] = useState(0)
  const [catalogOpen, setCatalogOpen] = useState(false)
  const skvWindows = useSkvWindows()
  const { closeAll: closeAllSkvWindows, open: openSkvWindow } = skvWindows

  function applyHeader(header) {
    setNameNar(header?.nameNar ?? '')
    setZadanieClosed(header?.zadanieClosed ?? null)
    setVipolnenieClosed(header?.vipolnenieClosed ?? null)
    setHasZadanie(Boolean(header?.hasZadanie))
    setHasVipolnenie(Boolean(header?.hasVipolnenie))
  }

  function skvOtherPartId(partId) {
    if (partId === zadaniePart.id) return hasVipolnenie ? vipolneniePart.id : null
    return hasZadanie ? zadaniePart.id : null
  }

  function handleSkvSaved(partId, result) {
    if (!result?.dateChanged && !(result?.paramsChanged > 0)) return
    if (partId === zadaniePart.id) {
      setZadanieReloadSignal((value) => value + 1)
    } else {
      setVipolnenieReloadSignal((value) => value + 1)
    }
  }

  useEffect(() => {
    let cancelled = false
    setNameNar('')
    setZadanieClosed(null)
    setVipolnenieClosed(null)
    setHasZadanie(false)
    setHasVipolnenie(false)
    setZadanieReloadSignal(0)
    setVipolnenieReloadSignal(0)
    setOpenPanels([])
    setMountedPanels({ zad: false, vip: false })
    setCatalogOpen(false)
    closeAllSkvWindows()
    if (id == null || id === '') return undefined
    fetchNaryadHeader(id)
      .then((header) => {
        if (cancelled) return
        applyHeader(header)
        const next = initialOpenPanels({
          hasZadanie: Boolean(header?.hasZadanie),
          hasVipolnenie: Boolean(header?.hasVipolnenie),
        })
        setOpenPanels(next)
        setMountedPanels({
          zad: next.includes('zad'),
          vip: next.includes('vip'),
        })
      })
      .catch(() => {
        if (cancelled) return
        setNameNar('')
        setZadanieClosed(null)
        setVipolnenieClosed(null)
        setHasVipolnenie(false)
        setOpenPanels(['zad'])
        setMountedPanels({ zad: true, vip: false })
      })
    return () => {
      cancelled = true
    }
  }, [id, closeAllSkvWindows])

  useEffect(() => {
    setMountedPanels((mounted) => ({
      zad: mounted.zad || openPanels.includes('zad'),
      vip: mounted.vip || openPanels.includes('vip'),
    }))
  }, [openPanels])

  const vipEnabled = isVipolneniePanelEnabled(hasVipolnenie)
  const showZad = openPanels.includes('zad')
  const showVip = openPanels.includes('vip')
  const bothOpen = showZad && showVip
  const horizontalSplit = bothOpen && splitOrientation === 'horizontal'
  const splitButtonTitle = bothOpen
    ? (splitOrientation === 'horizontal' ? 'Вертикальное деление' : 'Горизонтальное деление')
    : 'Доступно, когда открыты задание и выполнение'
  const title = nameNar
    ? `Наряд - ${id} ${nameNar}`
    : `Наряд - ${id}`

  return (
    <Box
      sx={{
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        minHeight: 0,
        overflow: 'hidden',
        bgcolor: 'background.default',
      }}
    >
      <Box
        sx={{
          height: ACTION_BAR_HEIGHT,
          flexShrink: 0,
          display: 'flex',
          alignItems: 'stretch',
          bgcolor: 'background.paper',
          borderBottom: 1,
          borderColor: 'divider',
        }}
      >
        <ToggleButtonGroup
          value={openPanels}
          onChange={(_e, next) => {
            setOpenPanels((prev) => toggleOpenPanels(prev, next, {
              available: vipEnabled ? PANEL_ORDER : ['zad'],
            }))
          }}
          sx={toggleGroupSx}
        >
          {PANELS.map((item) => (
            <ToggleButton
              key={item.value}
              value={item.value}
              disabled={item.value === 'vip' && !vipEnabled}
            >
              {item.label}
            </ToggleButton>
          ))}
        </ToggleButtonGroup>

        <Tooltip title={splitButtonTitle}>
          <Box component="span" sx={{ display: 'inline-flex', alignSelf: 'stretch' }}>
            <IconButton
              aria-label={splitButtonTitle}
              disabled={!bothOpen}
              onClick={() => {
                const next = splitOrientation === 'horizontal' ? 'vertical' : 'horizontal'
                writeStoredSplitOrientation(next)
                setSplitOrientation(next)
              }}
              sx={splitButtonSx}
            >
              {splitOrientation === 'horizontal' ? <VerticalSplit /> : <HorizontalSplit />}
            </IconButton>
          </Box>
        </Tooltip>

        <Typography
          component="h1"
          noWrap
          title={title}
          sx={{
            flex: 1,
            minWidth: 0,
            px: 2,
            display: 'flex',
            alignItems: 'center',
            fontWeight: 600,
            fontSize: '1rem',
          }}
        >
          {title}
        </Typography>

        <Tooltip title="Общие параметры наряда">
          <IconButton
            aria-label="Общие параметры наряда"
            sx={stubIconSx}
          >
            <Tune />
          </IconButton>
        </Tooltip>
        <Tooltip title="Каталог">
          <IconButton
            aria-label="Каталог"
            onClick={() => setCatalogOpen(true)}
            sx={stubIconSx}
          >
            <MenuBook />
          </IconButton>
        </Tooltip>
        <Tooltip title="Выйти из наряда">
          <IconButton
            aria-label="Выйти из наряда"
            onClick={() => navigate('/')}
            sx={stubIconSx}
          >
            <Close />
          </IconButton>
        </Tooltip>
      </Box>

      <Box
        sx={{
          flex: 1,
          minHeight: 0,
          minWidth: 0,
          display: 'flex',
          flexDirection: horizontalSplit ? 'column' : 'row',
          overflow: 'hidden',
        }}
      >
        {mountedPanels.zad ? (
          <Box sx={paneSx(showZad, bothOpen, bothOpen ? (horizontalSplit ? 'bottom' : 'right') : null)}>
            <NaryadWorkspacePanel
              part={zadaniePart}
              naryadId={id}
              closed={zadanieClosed}
              onClosedChange={setZadanieClosed}
              hasVipolnenie={hasVipolnenie}
              externalReloadSignal={zadanieReloadSignal}
              onOpenSkv={openSkvWindow}
              onVipolnenieCreated={(header) => {
                applyHeader(header)
                setOpenPanels(['zad', 'vip'])
              }}
            />
          </Box>
        ) : null}
        {mountedPanels.vip ? (
          <Box sx={paneSx(showVip, bothOpen, null)}>
            <NaryadWorkspacePanel
              part={vipolneniePart}
              naryadId={id}
              closed={vipolnenieClosed}
              onClosedChange={setVipolnenieClosed}
              externalReloadSignal={vipolnenieReloadSignal}
              onOpenSkv={openSkvWindow}
              onZadanieReplaced={(header) => {
                applyHeader(header)
                setZadanieReloadSignal((value) => value + 1)
              }}
            />
          </Box>
        ) : null}
      </Box>

      <CatalogDialog
        key={id}
        open={catalogOpen}
        onClose={() => setCatalogOpen(false)}
      />

      <SkvParamsWindows
        naryadId={id}
        skvWindows={skvWindows}
        parts={PARTS_BY_ID}
        otherPartId={skvOtherPartId}
        onSaved={handleSkvSaved}
      />
    </Box>
  )
}
