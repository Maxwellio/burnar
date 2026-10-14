import { useEffect, useState } from 'react'
import Box from '@mui/material/Box'
import IconButton from '@mui/material/IconButton'
import Tooltip from '@mui/material/Tooltip'
import Colorize from '@mui/icons-material/Colorize'
import FormatColorReset from '@mui/icons-material/FormatColorReset'
import { actionButtonSx } from '../../workspace/ActionButton.jsx'
import RowColorPalette from './RowColorPalette.jsx'

/**
 * Подсказка управляется вручную: гаснет в момент клика и не возвращается,
 * пока указатель заново не войдёт на иконку.
 */
const manualTooltipProps = {
  disableFocusListener: true,
  disableHoverListener: true,
  disableTouchListener: true,
  disableInteractive: true,
  TransitionProps: { timeout: 0 },
}

/** «Выделить строку цветом» с палитрой и «Сбросить цвет». colors — useRowColorEditing. */
export default function RowColorActions({ colors, isPending }) {
  const [colorTooltipOpen, setColorTooltipOpen] = useState(false)
  const [resetTooltipOpen, setResetTooltipOpen] = useState(false)

  const closeTooltips = () => {
    setColorTooltipOpen(false)
    setResetTooltipOpen(false)
  }

  useEffect(() => {
    if (colors.menuAnchor || !colors.enabled) closeTooltips()
  }, [colors.menuAnchor, colors.enabled])

  return (
    <>
      <Tooltip title="Выделить строку цветом" open={colorTooltipOpen} {...manualTooltipProps}>
        <Box
          component="span"
          onMouseEnter={() => {
            if (colors.isMenuOpen() || isPending()) return
            setColorTooltipOpen(true)
          }}
          onMouseLeave={() => setColorTooltipOpen(false)}
          sx={{ display: 'inline-flex', position: 'relative' }}
        >
          <IconButton
            aria-label="Выделить строку цветом"
            aria-haspopup="dialog"
            aria-expanded={Boolean(colors.menuAnchor)}
            disabled={!colors.enabled}
            onClick={(event) => {
              event.currentTarget.blur()
              closeTooltips()
              colors.openMenu(event.currentTarget)
            }}
            sx={actionButtonSx}
          >
            <Colorize />
          </IconButton>
          <RowColorPalette colors={colors} />
        </Box>
      </Tooltip>
      <Tooltip title="Сбросить цвет" open={resetTooltipOpen} {...manualTooltipProps}>
        <Box
          component="span"
          onMouseEnter={() => {
            if (isPending()) return
            setResetTooltipOpen(true)
          }}
          onMouseLeave={() => setResetTooltipOpen(false)}
          sx={{ display: 'inline-flex' }}
        >
          <IconButton
            aria-label="Сбросить цвет"
            disabled={!colors.enabled}
            onClick={(event) => {
              event.currentTarget.blur()
              closeTooltips()
              void colors.applyColor(0)
            }}
            sx={actionButtonSx}
          >
            <FormatColorReset />
          </IconButton>
        </Box>
      </Tooltip>
    </>
  )
}
