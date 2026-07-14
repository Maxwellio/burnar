import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Typography from '@mui/material/Typography'
import { useAuth } from '../context/AuthContext.jsx'

/**
 * Заглушка главной после успешного логина.
 * Позже сюда переедут экраны из Delphi; сейчас — проверка сессии.
 */
export default function Home() {
  const { user, logout } = useAuth()

  const handleLogout = async () => {
    try {
      await logout()
    } finally {
      window.location.replace('/login')
    }
  }

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h1" gutterBottom>
        Burnar
      </Typography>
      <Typography color="text.secondary" paragraph>
        Главная страница (заглушка). Вход выполнен успешно.
      </Typography>
      {user && (
        <Typography paragraph>
          Пользователь: {user.username}
          {user.userId != null ? ` (id ${user.userId})` : ''}
        </Typography>
      )}
      <Button variant="outlined" onClick={handleLogout}>
        Выйти
      </Button>
    </Box>
  )
}
