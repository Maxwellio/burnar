import { Routes, Route } from 'react-router-dom'
import { ThemeProvider, CssBaseline, GlobalStyles } from '@mui/material'
import { theme, globalLegacyAnchorStyles } from './theme.js'
import Home from './pages/Home.jsx'

// Тема + маршруты; страницы добавлять в Routes, стили — через theme/sx.
export default function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <GlobalStyles styles={globalLegacyAnchorStyles(theme)} />
      <Routes>
        <Route path="/" element={<Home />} />
      </Routes>
    </ThemeProvider>
  )
}
