import { useState } from 'react'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Typography from '@mui/material/Typography'
import { AxiosProvider, BaseTable } from 'mainComponent'
import { useAuth } from '../context/AuthContext.jsx'
import { naryadColumns } from './naryadColumns.js'

/**
 * Главная после логина: список нарядов бурения через BaseTable (mainComponent).
 * Данные: GET /api/naryady (pageable), SQL как в Delphi NarListUnit без ACL/дат.
 */
export default function Home() {
  const { user, logout } = useAuth()
  // BaseTable держит фильтры снаружи (manualFiltering); пока пустой массив
  const [filters, setFilters] = useState([])

  const handleLogout = async () => {
    try {
      await logout()
    } finally {
      window.location.replace('/login')
    }
  }

  return (
    <Box
      sx={{
        p: 2,
        height: '100vh',
        display: 'flex',
        flexDirection: 'column',
        boxSizing: 'border-box',
        gap: 1.5,
      }}
    >
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexShrink: 0,
        }}
      >
        <Box>
          <Typography variant="h1" sx={{ fontSize: '1.5rem', mb: 0.5 }}>
            Burnar
          </Typography>
          <Typography color="text.secondary" variant="body2">
            Список нарядов бурения
            {user ? ` — ${user.username}` : ''}
          </Typography>
        </Box>
        <Button variant="outlined" onClick={handleLogout}>
          Выйти
        </Button>
      </Box>

      {/* h-full у BaseTable требует явной высоты родителя */}
      <Box sx={{ flex: 1, minHeight: 0 }}>
        <AxiosProvider baseapi="/api">
          <BaseTable
            url="/naryady"
            baseUrl="/api"
            columns={naryadColumns}
            filters={filters}
            setFilters={setFilters}
            pageable
          />
        </AxiosProvider>
      </Box>
    </Box>
  )
}
