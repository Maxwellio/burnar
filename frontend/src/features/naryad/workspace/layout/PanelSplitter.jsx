import Box from '@mui/material/Box'
import { SPLITTER_THICKNESS } from '../../naryadPageLayout.js'

/** Полоса между деревом и правой панелью, половинами наряда или над блоком итогов. */
export default function PanelSplitter({
  ariaLabel,
  dragging,
  onPointerDown,
  onDoubleClick,
  orientation = 'vertical',
}) {
  const horizontal = orientation === 'horizontal'
  return (
    <Box
      role="separator"
      aria-orientation={horizontal ? 'horizontal' : 'vertical'}
      aria-label={ariaLabel}
      onPointerDown={onPointerDown}
      onDoubleClick={onDoubleClick}
      sx={{
        width: horizontal ? 'auto' : SPLITTER_THICKNESS,
        height: horizontal ? SPLITTER_THICKNESS : 'auto',
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
