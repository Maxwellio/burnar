import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'

/** Заглушка раздела «Админ-панель» (/admin) — маршрут под AdminOnly (ROLE_ADMIN). */
export default function Admin() {
  return (
    <Box sx={{ p: 2 }}>
      <Typography variant="h6" gutterBottom>
        Админ-панель
      </Typography>
      <Typography color="text.secondary">Раздел в разработке</Typography>
    </Box>
  )
}
