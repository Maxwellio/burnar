import { Routes, Route, Navigate } from 'react-router-dom'
import { ThemeProvider, CssBaseline, GlobalStyles } from '@mui/material'
import { theme, globalLegacyAnchorStyles } from './theme.js'
import { AuthProvider } from './context/AuthContext.jsx'
import ProtectedLayout from './components/ProtectedLayout.jsx'
import Home from './pages/Home.jsx'
import Login from './pages/Login.jsx'
import Catalog from './pages/Catalog.jsx'
import Reports from './pages/Reports.jsx'
import Settings from './pages/Settings.jsx'
import Admin from './pages/Admin.jsx'

/**
 * Тема + маршруты: /login публичный, остальное под ProtectedLayout (сессия + AppBar/Drawer).
 */
export default function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <GlobalStyles styles={globalLegacyAnchorStyles(theme)} />
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route element={<ProtectedLayout />}>
            <Route path="/" element={<Home />} />
            <Route path="/catalog" element={<Catalog />} />
            <Route path="/reports" element={<Reports />} />
            <Route path="/settings" element={<Settings />} />
            <Route path="/admin" element={<Admin />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Route>
        </Routes>
      </AuthProvider>
    </ThemeProvider>
  )
}
