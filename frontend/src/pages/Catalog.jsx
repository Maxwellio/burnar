import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'

/** Заглушка раздела «Справочники» (/catalog). */
export default function Catalog() {
  return (
    <Box sx={{ p: 2 }}>
      <Typography variant="h6" gutterBottom>
        Справочники
      </Typography>
      <Typography color="text.secondary">Раздел в разработке</Typography>
    </Box>
  )
}
