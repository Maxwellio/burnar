import { Routes, Route, Navigate } from 'react-router-dom'
import { ThemeProvider, CssBaseline, GlobalStyles } from '@mui/material'
import { theme, globalLegacyAnchorStyles } from './theme.js'
import { AuthProvider } from './context/AuthContext.jsx'
import ProtectedRoute from './components/ProtectedRoute.jsx'
import Home from './pages/Home.jsx'
import Login from './pages/Login.jsx'

/**
 * Тема + маршруты: /login публичный, / только с сессией.
 * Без AuthProvider ProtectedRoute/Login не получат fetchUser.
 */
export default function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <GlobalStyles styles={globalLegacyAnchorStyles(theme)} />
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <Home />
              </ProtectedRoute>
            }
          />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AuthProvider>
    </ThemeProvider>
  )
}
