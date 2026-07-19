import { useEffect, useState } from 'react'
import { Navigate, Outlet, useLocation } from 'react-router-dom'
import AppBar from '@mui/material/AppBar'
import Toolbar from '@mui/material/Toolbar'
import Box from '@mui/material/Box'
import { useAuth } from '../context/AuthContext.jsx'
import Navigation from './Navigation.jsx'

/**
 * Оболочка защищённых маршрутов — каркас из navcode.txt.
 * Фон/бордеры из theme.palette (background / divider / text).
 */
export default function ProtectedLayout() {
  const { user, loading, fetchUser } = useAuth()
  const location = useLocation()
  const [initialCheckDone, setInitialCheckDone] = useState(false)

  useEffect(() => {
    if (user !== null) {
      setInitialCheckDone(true)
      return
    }
    let cancelled = false
    fetchUser().then(() => {
      if (!cancelled) setInitialCheckDone(true)
    })
    return () => { cancelled = true }
  }, [user, fetchUser])

  if (!initialCheckDone || (loading && user === null)) {
    return (
      <Box sx={{ p: 2, textAlign: 'center' }}>
        Проверка авторизации…
      </Box>
    )
  }

  if (user === null) {
    return <Navigate to="/login" state={{ from: location }} replace />
  }

  return (
    <Box
      sx={{
        display: 'flex',
        height: '100vh',
        overflow: 'hidden',
        bgcolor: 'background.default',
      }}
    >
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          flex: 1,
          overflow: 'hidden',
          height: '100%',
        }}
      >
        <AppBar
          position="static"
          elevation={0}
          sx={{
            bgcolor: 'background.paper',
            borderBottom: 1,
            borderColor: 'divider',
            color: 'text.primary',
          }}
        >
          <Toolbar disableGutters sx={{ minHeight: '48px !important', px: 1 }}>
            <Navigation />
            <Box sx={{ textAlign: 'left', flex: 1, pl: 2, fontWeight: 600 }}>
              Burnar
            </Box>
            <Box sx={{ textAlign: 'right', flex: 1, pr: 2, color: 'text.secondary' }}>
              {user.username}
            </Box>
          </Toolbar>
        </AppBar>
        <Box
          component="main"
          sx={{
            flex: 1,
            minHeight: 0,
            display: 'flex',
            flexDirection: 'column',
            bgcolor: 'background.default',
          }}
        >
          <Outlet />
        </Box>
        <div id="footer-portal-root" />
      </Box>
    </Box>
  )
}
