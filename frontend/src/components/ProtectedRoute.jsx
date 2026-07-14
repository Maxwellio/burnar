import { useEffect, useState } from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import Box from '@mui/material/Box'
import { useAuth } from '../context/AuthContext.jsx'

/**
 * Обёртка для маршрутов, требующих сессии.
 * Без user → редирект на /login; иначе рендер children (сейчас Home).
 */
function ProtectedRoute({ children }) {
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

  return children
}

export default ProtectedRoute
