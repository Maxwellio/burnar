import { useEffect, useState } from 'react'
import Box from '@mui/material/Box'
import Checkbox from '@mui/material/Checkbox'
import FormControlLabel from '@mui/material/FormControlLabel'
import Stack from '@mui/material/Stack'
import TextField from '@mui/material/TextField'
import Typography from '@mui/material/Typography'
import { fetchAdminUser } from '../api/adminUsersApi.js'

/**
 * Верх правой панели админки: поля учётки (read + локальный state).
 * Сохранение / пароль — позже (docs/admin-panel-notes.md).
 *
 * @param {{ peopleId: number | null }} props
 */
export default function AdminUserFormPanel({ peopleId }) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [fio, setFio] = useState('')
  const [oraName, setOraName] = useState('')
  const [password, setPassword] = useState('')
  const [dtEnter, setDtEnter] = useState('')
  const [dtOut, setDtOut] = useState('')
  const [note, setNote] = useState('')
  const [active, setActive] = useState(false)
  const [usersId, setUsersId] = useState(null)

  useEffect(() => {
    if (peopleId == null) {
      setFio('')
      setOraName('')
      setPassword('')
      setDtEnter('')
      setDtOut('')
      setNote('')
      setActive(false)
      setUsersId(null)
      setError(null)
      setLoading(false)
      return undefined
    }

    let cancelled = false
    setLoading(true)
    setError(null)
    setPassword('')
    fetchAdminUser(peopleId)
      .then((data) => {
        if (cancelled) return
        setUsersId(data.usersId ?? null)
        setFio(data.fio ?? '')
        setOraName(data.oraName ?? '')
        setDtEnter(data.dtEnter ? String(data.dtEnter).slice(0, 10) : '')
        setDtOut(data.dtOut ? String(data.dtOut).slice(0, 10) : '')
        setNote(data.note ?? '')
        setActive(data.active === 1)
      })
      .catch((e) => {
        if (cancelled) return
        setError(e instanceof Error ? e.message : 'Не удалось загрузить пользователя')
        setFio('')
        setOraName('')
        setDtEnter('')
        setDtOut('')
        setNote('')
        setActive(false)
        setUsersId(null)
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [peopleId])

  const disabled = peopleId == null || loading
  const title =
    peopleId == null
      ? 'Пользователь не выбран'
      : usersId != null
        ? `Пользователь #${usersId}`
        : `Человек #${peopleId} (без учётки)`

  return (
    <Stack spacing={1.5} sx={{ width: '100%', flexShrink: 0 }}>
      <Typography variant="subtitle2" color="text.secondary">
        {loading ? 'Загрузка…' : title}
      </Typography>

      {error && (
        <Typography variant="body2" color="error">
          {error}
        </Typography>
      )}

      <TextField
        size="small"
        label="ФИО"
        value={fio}
        onChange={(e) => setFio(e.target.value)}
        fullWidth
        disabled={disabled}
      />

      <TextField
        size="small"
        label="Логин"
        value={oraName}
        onChange={(e) => setOraName(e.target.value)}
        fullWidth
        disabled={disabled}
      />

      <TextField
        size="small"
        label="Пароль"
        type="password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        fullWidth
        disabled={disabled}
        autoComplete="new-password"
        helperText="Сохранение и смена пароля — в следующей итерации"
      />

      <TextField
        size="small"
        label="Дата подключения"
        type="date"
        value={dtEnter}
        onChange={(e) => setDtEnter(e.target.value)}
        fullWidth
        disabled={disabled}
        InputLabelProps={{ shrink: true }}
      />

      <TextField
        size="small"
        label="Дата отключения"
        type="date"
        value={dtOut}
        onChange={(e) => setDtOut(e.target.value)}
        fullWidth
        disabled={disabled}
        InputLabelProps={{ shrink: true }}
      />

      <TextField
        size="small"
        label="Примечание"
        value={note}
        onChange={(e) => setNote(e.target.value)}
        fullWidth
        disabled={disabled}
        multiline
        minRows={2}
      />

      <Box>
        <FormControlLabel
          control={
            <Checkbox
              checked={active}
              onChange={(e) => setActive(e.target.checked)}
              disabled={disabled}
            />
          }
          label="Активен"
        />
      </Box>
    </Stack>
  )
}
