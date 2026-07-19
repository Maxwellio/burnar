import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'

/** Заглушка раздела «Отчеты» (/reports). */
export default function Reports() {
  return (
    <Box sx={{ p: 2 }}>
      <Typography variant="h6" gutterBottom>
        Отчеты
      </Typography>
      <Typography color="text.secondary">Раздел в разработке</Typography>
    </Box>
  )
}
