import { useEffect, useState } from 'react'
import Box from '@mui/material/Box'
import Checkbox from '@mui/material/Checkbox'
import FormControl from '@mui/material/FormControl'
import FormControlLabel from '@mui/material/FormControlLabel'
import InputLabel from '@mui/material/InputLabel'
import MenuItem from '@mui/material/MenuItem'
import Select from '@mui/material/Select'
import Stack from '@mui/material/Stack'
import TextField from '@mui/material/TextField'
import Typography from '@mui/material/Typography'
import { format } from 'date-fns'
import { fetchAdminUser } from '../api/adminUsersApi.js'
import { fetchOrgTree, fetchPositions } from '../api/responsiblePersonsApi.js'

/**
 * Верх правой панели админки: поля учётки (read + локальный state).
 * mode='add' — заготовка формы нового пользователя (сохранение позже).
 *
 * @param {{ peopleId: number | null, mode?: 'view' | 'add' }} props
 */
export default function AdminUserFormPanel({ peopleId, mode = 'view' }) {
  const isAdding = mode === 'add'
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
  const [dateIn, setDateIn] = useState('')
  const [doljId, setDoljId] = useState('')
  const [orgId, setOrgId] = useState('')
  const [positions, setPositions] = useState([])
  const [orgTree, setOrgTree] = useState([])

  const resetAccountFields = () => {
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
  }

  const resetCareerFields = () => {
    setDateIn(format(new Date(), 'yyyy-MM-dd'))
    setDoljId('')
    setOrgId('')
  }

  useEffect(() => {
    if (isAdding) {
      resetAccountFields()
      resetCareerFields()
      return undefined
    }

    setDateIn('')
    setDoljId('')
    setOrgId('')

    if (peopleId == null) {
      resetAccountFields()
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
  }, [peopleId, isAdding])

  useEffect(() => {
    if (!isAdding) {
      setPositions([])
      setOrgTree([])
      return undefined
    }

    let cancelled = false
    Promise.all([fetchPositions(), fetchOrgTree()])
      .then(([pos, orgs]) => {
        if (cancelled) return
        setPositions(Array.isArray(pos) ? pos : [])
        setOrgTree(Array.isArray(orgs) ? orgs : [])
      })
      .catch((e) => {
        if (cancelled) return
        setError(e instanceof Error ? e.message : 'Не удалось загрузить справочники')
        setPositions([])
        setOrgTree([])
      })

    return () => {
      cancelled = true
    }
  }, [isAdding])

  const disabled = !isAdding && (peopleId == null || loading)
  const title = isAdding
    ? 'Добавление пользователя'
    : peopleId == null
      ? 'Пользователь не выбран'
      : usersId != null
        ? `Пользователь #${usersId}`
        : `Человек #${peopleId} (без учётки)`

  return (
    <Stack spacing={1.5} sx={{ width: '100%', flexShrink: 0 }}>
      <Typography variant="subtitle2" color="text.secondary">
        {loading && !isAdding ? 'Загрузка…' : title}
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

      {isAdding && (
        <>
          <TextField
            size="small"
            label="Дата ввода в должность"
            type="date"
            value={dateIn}
            onChange={(e) => setDateIn(e.target.value)}
            required
            fullWidth
            InputLabelProps={{ shrink: true }}
          />
          <FormControl fullWidth size="small" required>
            <InputLabel id="admin-add-dolj-label">Должность</InputLabel>
            <Select
              labelId="admin-add-dolj-label"
              label="Должность"
              value={doljId}
              onChange={(e) => setDoljId(e.target.value)}
            >
              {positions.map((p) => (
                <MenuItem key={p.id} value={String(p.id)}>
                  {p.name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          <FormControl fullWidth size="small" required>
            <InputLabel id="admin-add-org-label">Структура</InputLabel>
            <Select
              labelId="admin-add-org-label"
              label="Структура"
              value={orgId}
              onChange={(e) => setOrgId(e.target.value)}
            >
              {orgTree.map((o) => (
                <MenuItem key={o.id} value={String(o.id)}>
                  {o.name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </>
      )}

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
