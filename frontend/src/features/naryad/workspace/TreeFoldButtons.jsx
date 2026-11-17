import Button from '@mui/material/Button'
import Box from '@mui/material/Box'
import UnfoldLess from '@mui/icons-material/UnfoldLess'
import UnfoldMore from '@mui/icons-material/UnfoldMore'

const buttonOutlinedSx = {
  textTransform: 'none',
  bgcolor: 'background.paper',
  borderColor: 'divider',
  color: 'text.secondary',
}

/** «Раскрыть все» / «Свернуть все» — те же кнопки, что над деревом каталога. */
export default function TreeFoldButtons({ onExpandAll, onCollapseAll }) {
  return (
    <Box
      sx={{
        display: 'flex',
        alignItems: 'center',
        gap: 1,
        flexWrap: 'wrap',
        flexShrink: 0,
        px: 1,
        py: 0.5,
      }}
    >
      <Button
        size="small"
        variant="outlined"
        startIcon={<UnfoldMore />}
        sx={buttonOutlinedSx}
        onClick={onExpandAll}
      >
        Раскрыть все
      </Button>
      <Button
        size="small"
        variant="outlined"
        startIcon={<UnfoldLess />}
        sx={buttonOutlinedSx}
        onClick={onCollapseAll}
      >
        Свернуть все
      </Button>
    </Box>
  )
}
