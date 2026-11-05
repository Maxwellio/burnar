import Box from '@mui/material/Box'

/** Полоса между деревом и правой панелью, либо над блоком итогов. */
export default function PanelSplitter({
  ariaLabel,
  dragging,
  onPointerDown,
  orientation = 'vertical',
}) {
  const horizontal = orientation === 'horizontal'
  return (
    <Box
      role="separator"
      aria-orientation={horizontal ? 'horizontal' : 'vertical'}
      aria-label={ariaLabel}
      onPointerDown={onPointerDown}
      sx={{
        width: horizontal ? 'auto' : 6,
        height: horizontal ? 6 : 'auto',
        alignSelf: 'stretch',
        flexShrink: 0,
        cursor: horizontal ? 'row-resize' : 'col-resize',
        touchAction: 'none',
        bgcolor: dragging ? 'action.selected' : 'divider',
        '&:hover': { bgcolor: 'action.selected' },
      }}
    />
  )
}
