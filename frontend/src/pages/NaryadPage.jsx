import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import Box from '@mui/material/Box'
import IconButton from '@mui/material/IconButton'
import ToggleButton from '@mui/material/ToggleButton'
import ToggleButtonGroup from '@mui/material/ToggleButtonGroup'
import Tooltip from '@mui/material/Tooltip'
import Typography from '@mui/material/Typography'
import Close from '@mui/icons-material/Close'
import MenuBook from '@mui/icons-material/MenuBook'
import Tune from '@mui/icons-material/Tune'
import { fetchNaryadHeader } from '../api/naryadyApi.js'
import NaryadWorkspacePanel from './NaryadWorkspacePanel.jsx'
import { ACTION_BAR_HEIGHT } from './naryadPageLayout.js'

/** Вкладки карточки наряда — Delphi TfrmComNarZad / TfrmComNarVip. */
const PANELS = [
  { value: 'zad', label: 'Задание' },
  { value: 'vip', label: 'Выполнение' },
]

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

/**
 * Карточка наряда /naryad/:id.
 * Action bar под шапкой приложения: вкладки на всю высоту бара, подпись наряда,
 * справа заглушки параметров/каталога и выход на список.
 */
export default function NaryadPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [panel, setPanel] = useState('zad')
  const [nameNar, setNameNar] = useState('')

  useEffect(() => {
    let cancelled = false
    setNameNar('')
    if (id == null || id === '') return undefined
    fetchNaryadHeader(id)
      .then((header) => {
        if (!cancelled) setNameNar(header?.nameNar ?? '')
      })
      .catch(() => {
        if (!cancelled) setNameNar('')
      })
    return () => {
      cancelled = true
    }
  }, [id])

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
          value={panel}
          exclusive
          onChange={(_e, next) => {
            if (next !== null) setPanel(next)
          }}
          sx={toggleGroupSx}
        >
          {PANELS.map((item) => (
            <ToggleButton key={item.value} value={item.value}>
              {item.label}
            </ToggleButton>
          ))}
        </ToggleButtonGroup>

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

      <NaryadWorkspacePanel kind={panel} naryadId={id} />
    </Box>
  )
}
