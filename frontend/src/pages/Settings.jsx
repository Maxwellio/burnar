import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'

/** Заглушка раздела «Настройки» (/settings) — контент появится позже. */
export default function Settings() {
  return (
    <Box sx={{ p: 2 }}>
      <Typography variant="h6" gutterBottom>
        Настройки
      </Typography>
      <Typography color="text.secondary">Раздел в разработке</Typography>
    </Box>
  )
}
