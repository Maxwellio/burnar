import Box from '@mui/material/Box'
import IconButton from '@mui/material/IconButton'
import Tooltip from '@mui/material/Tooltip'
import Close from '@mui/icons-material/Close'

/** Заголовок с крестиком справа, как у сквозных параметров. Текст остаётся шрифтом DialogTitle. */
export const dialogTitleWithCloseSx = {
  display: 'flex',
  alignItems: 'center',
  gap: 1,
  pr: 1,
}

export function DialogTitleText({ children }) {
  return (
    <Box component="span" sx={{ flex: 1, minWidth: 0 }}>
      {children}
    </Box>
  )
}

/** Тот же обработчик, что у нижней кнопки закрытия окна. */
export default function DialogCloseButton({ onClick, disabled = false }) {
  return (
    <Tooltip title="Закрыть">
      <span>
        <IconButton
          aria-label="Закрыть"
          onClick={onClick}
          disabled={disabled}
          sx={{ color: 'text.secondary' }}
        >
          <Close />
        </IconButton>
      </span>
    </Tooltip>
  )
}
