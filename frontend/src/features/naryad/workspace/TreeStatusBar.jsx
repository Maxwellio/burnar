import Box from '@mui/material/Box'

/**
 * Неподвижная строка под деревом: выбор и итоги CalcItogsNS.
 * items — результат treeFooterStatusItems; divider рисует черту перед куском.
 * actions прижимаются к правому краю и не уезжают вместе с текстом.
 */
export default function TreeStatusBar({ items, actions = null }) {
  return (
    <Box
      sx={{
        height: 32,
        flexShrink: 0,
        display: 'flex',
        alignItems: 'stretch',
        boxSizing: 'border-box',
        borderTop: 1,
        borderColor: 'divider',
        bgcolor: '#F1F3F5',
        color: '#364FC7',
        fontSize: '0.875rem',
        fontWeight: 600,
      }}
    >
      <Box
        role="status"
        aria-live="polite"
        sx={{
          flex: 1,
          minWidth: 0,
          display: 'flex',
          alignItems: 'stretch',
          px: 1.5,
          overflowX: 'auto',
        }}
      >
        {items.map((item) => (
          <Box
            key={item.text}
            sx={{
              display: 'flex',
              alignItems: 'center',
              flexShrink: 0,
              whiteSpace: 'nowrap',
              pl: item.divider ? 1.5 : 0,
              ml: item.divider ? 1.5 : 0,
              borderLeft: item.divider ? '2px solid #364FC7' : 0,
            }}
          >
            {item.text}
          </Box>
        ))}
      </Box>
      {actions}
    </Box>
  )
}
