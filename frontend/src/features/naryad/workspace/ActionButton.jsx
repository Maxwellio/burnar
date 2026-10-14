import Box from '@mui/material/Box'
import IconButton from '@mui/material/IconButton'
import Tooltip from '@mui/material/Tooltip'
import { ACTION_BAR_HEIGHT } from '../naryadPageLayout.js'

export const actionButtonSx = {
  height: '100%',
  width: ACTION_BAR_HEIGHT,
  borderRadius: 0,
  borderRight: 1,
  borderColor: 'divider',
  color: 'text.secondary',
}

/**
 * Квадратная кнопка панели действий с подсказкой.
 * Обёртка span нужна, чтобы Tooltip работал и у выключенной кнопки.
 */
export default function ActionButton({ label, icon: Icon, disabled, onClick }) {
  return (
    <Tooltip title={label}>
      <Box component="span" sx={{ display: 'inline-flex' }}>
        <IconButton
          aria-label={label}
          disabled={disabled}
          onClick={onClick}
          sx={actionButtonSx}
        >
          <Icon />
        </IconButton>
      </Box>
    </Tooltip>
  )
}
