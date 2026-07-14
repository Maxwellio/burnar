import { useNavigate, Navigate } from 'react-router-dom'
import Box from '@mui/material/Box'
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import TextField from '@mui/material/TextField'
import Button from '@mui/material/Button'
import Typography from '@mui/material/Typography'
import { useAuth } from '../context/AuthContext.jsx'
import { useLogin } from '../hooks/useLogin.js'

/**
 * Форма входа: ora_name + пароль → POST /api/login.
 * Уже авторизованный пользователь сразу уходит на /.
 */
function Login() {
  const navigate = useNavigate()
  const { user, fetchUser } = useAuth()
  const {
    username,
    password,
    error,
    submitting,
    sessionChecked,
    setUsername,
    setPassword,
    handleSubmit,
  } = useLogin(fetchUser, navigate)

  if (!sessionChecked) {
    return (
      <Box
        sx={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          p: 2,
          bgcolor: 'background.default',
        }}
      >
        <Card sx={{ width: '100%', maxWidth: 360 }}>
          <CardContent>
            <Typography variant="body2" color="text.secondary">
              Проверка авторизации…
            </Typography>
          </CardContent>
        </Card>
      </Box>
    )
  }

  if (user) {
    return <Navigate to="/" replace />
  }

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        p: 2,
        bgcolor: 'background.default',
      }}
    >
      <Card sx={{ width: '100%', maxWidth: 360 }}>
        <CardContent>
          <Typography variant="h6" component="h2" sx={{ m: '0 0 1.5rem', textAlign: 'center' }}>
            Вход
          </Typography>
          <Box component="form" onSubmit={handleSubmit} sx={{ display: 'flex', flexDirection: 'column' }}>
            <TextField
              fullWidth
              label="Логин"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              autoComplete="username"
              required
              disabled={submitting}
              margin="normal"
            />
            <TextField
              fullWidth
              label="Пароль"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
              required
              disabled={submitting}
              margin="normal"
            />
            <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
              Проверяйте вводимые данные
            </Typography>
            {error && (
              <Typography
                variant="body2"
                role="alert"
                sx={{
                  mt: 1,
                  p: 1,
                  color: '#8b3a3a',
                  bgcolor: '#faf0f0',
                  borderRadius: 1,
                }}
              >
                {error}
              </Typography>
            )}
            <Button
              type="submit"
              variant="contained"
              color="primary"
              fullWidth
              disabled={submitting}
              sx={{ mt: 2 }}
            >
              {submitting ? 'Вход…' : 'Войти'}
            </Button>
          </Box>
        </CardContent>
      </Card>
    </Box>
  )
}

export default Login
