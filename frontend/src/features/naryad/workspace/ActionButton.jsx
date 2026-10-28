import WarningAmber from '@mui/icons-material/WarningAmber'
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
export default function ActionButton({ label, icon: Icon, disabled, onClick, warning = null }) {
  const title = warning || label
  return (
    <Tooltip title={title}>
      <Box component="span" sx={{ display: 'inline-flex', position: 'relative' }}>
        <IconButton
          aria-label={warning ? `${label}. ${warning}` : label}
          disabled={disabled}
          onClick={onClick}
          sx={actionButtonSx}
        >
          <Icon />
        </IconButton>
        {warning ? (
          <WarningAmber
            aria-hidden
            sx={{
              position: 'absolute',
              right: 1,
              bottom: 1,
              fontSize: 14,
              color: 'warning.main',
              pointerEvents: 'none',
            }}
          />
        ) : null}
      </Box>
    </Tooltip>
  )
}
