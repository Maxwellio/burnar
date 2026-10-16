import Box from '@mui/material/Box'
import { ACTION_BAR_HEIGHT } from '../naryadPageLayout.js'

/** Внутренняя панель действий задания или выполнения (48px, кнопки встык). */
export default function WorkspaceActionBar({ ariaLabel, children }) {
  return (
    <Box
      aria-label={ariaLabel}
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
      {children}
    </Box>
  )
}
