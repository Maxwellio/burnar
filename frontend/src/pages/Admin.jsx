import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'

/** Заглушка раздела «Админ-панель» (/admin) — только ROLE_ADMIN в меню. */
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
