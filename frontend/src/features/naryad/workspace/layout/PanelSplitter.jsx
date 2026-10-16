import Box from '@mui/material/Box'

/** Вертикальная полоса между деревом и правой панелью. */
export default function PanelSplitter({ ariaLabel, dragging, onPointerDown }) {
  return (
    <Box
      role="separator"
      aria-orientation="vertical"
      aria-label={ariaLabel}
      onPointerDown={onPointerDown}
      sx={{
        width: 6,
        flexShrink: 0,
        cursor: 'col-resize',
        touchAction: 'none',
        bgcolor: dragging ? 'action.selected' : 'divider',
        '&:hover': { bgcolor: 'action.selected' },
      }}
    />
  )
}
