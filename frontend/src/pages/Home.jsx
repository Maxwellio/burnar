import { useEffect, useState } from 'react'
import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import { requestJson } from '../api/http.js'

/**
 * Стартовая страница: проверяет /api/health через proxy.
 * Если backend не запущен или Postgres недоступен — покажем ошибку здесь.
 */
export default function Home() {
  const [health, setHealth] = useState(null)
  const [error, setError] = useState(null)

  useEffect(() => {
    let cancelled = false
    requestJson('/health')
      .then((data) => {
        if (!cancelled) setHealth(data)
      })
      .catch((err) => {
        if (!cancelled) setError(err.message || String(err))
      })
    return () => {
      cancelled = true
    }
  }, [])

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h1" gutterBottom>
        Burnar
      </Typography>
      <Typography color="text.secondary" paragraph>
        Каркас React + MUI. Backend: порт 8095, proxy /api.
      </Typography>
      {error && (
        <Typography color="error">
          Health: {error}
        </Typography>
      )}
      {health && (
        <Typography>
          Health: {health.status} ({health.service})
        </Typography>
      )}
      {!error && !health && (
        <Typography color="text.secondary">
          Проверка /api/health…
        </Typography>
      )}
    </Box>
  )
}
