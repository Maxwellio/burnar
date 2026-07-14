import { createContext, useContext, useState, useCallback } from 'react'
import { getCurrentUser as apiGetCurrentUser, logout as apiLogout } from '../api/authApi.js'

/**
 * Глобальное состояние сессии: кто залогинен после GET /api/current-user.
 * Оборачивает Routes в App.jsx; ProtectedRoute и Login берут user/fetchUser отсюда.
 */
const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(false)

  const fetchUser = useCallback(async () => {
    setLoading(true)
    try {
      const u = await apiGetCurrentUser()
      setUser(u)
      return u
    } finally {
      setLoading(false)
    }
  }, [])

  const logout = useCallback(async () => {
    await apiLogout()
    setUser(null)
  }, [])

  const value = { user, setUser, loading, fetchUser, logout }
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
