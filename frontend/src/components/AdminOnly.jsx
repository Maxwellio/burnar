import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'
import { isAdmin } from '../utils/roles.js'

/**
 * Вложенный guard: только ROLE_ADMIN (меню уже скрывает пункт).
 * Используется внутри ProtectedLayout — сессия уже проверена.
 */
export default function AdminOnly() {
  const { user } = useAuth()
  if (!isAdmin(user)) {
    return <Navigate to="/" replace />
  }
  return <Outlet />
}
