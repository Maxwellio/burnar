import { useState } from 'react'
import { useParams } from 'react-router-dom'
import Box from '@mui/material/Box'
import ToggleButton from '@mui/material/ToggleButton'
import ToggleButtonGroup from '@mui/material/ToggleButtonGroup'
import Typography from '@mui/material/Typography'

/** Вкладки карточки наряда — Delphi TfrmComNarZad / TfrmComNarVip. Наполнение позже. */
const PANELS = [
  { value: 'zad', label: 'Задание' },
  { value: 'vip', label: 'Выполнение' },
]

/**
 * Карточка наряда /naryad/:id.
 * ToggleButtonGroup — заглушка под будущие формы, которые развернутся вниз при выборе вкладки.
 */
export default function NaryadPage() {
  const { id } = useParams()
  const [panel, setPanel] = useState('zad')

  return (
    <Box
      sx={{
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        minHeight: 0,
        overflow: 'hidden',
        p: 2.5,
        gap: 2,
        bgcolor: 'background.default',
        boxSizing: 'border-box',
      }}
    >
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          gap: 2,
          flexWrap: 'wrap',
          flexShrink: 0,
        }}
      >
        <Typography variant="h6" component="h1">
          Наряд {id}
        </Typography>
        <ToggleButtonGroup
          value={panel}
          exclusive
          onChange={(_e, next) => {
            if (next !== null) setPanel(next)
          }}
          sx={{
            '& .MuiToggleButton-root': {
              textTransform: 'none',
              px: 2,
              py: 1,
              color: 'black',
              borderColor: 'divider',
            },
            '& .MuiToggleButton-root.Mui-selected': {
              color: '#1976d2',
              backgroundColor: '#D0EBFF',
              '&:hover': {
                backgroundColor: '#B1D7FF',
              },
            },
          }}
        >
          {PANELS.map((item) => (
            <ToggleButton key={item.value} value={item.value}>
              {item.label}
            </ToggleButton>
          ))}
        </ToggleButtonGroup>
      </Box>

      <Box
        sx={{
          flex: 1,
          minHeight: 0,
          bgcolor: 'background.paper',
          border: 1,
          borderColor: 'divider',
        }}
      />
    </Box>
  )
}
