import { useEffect, useState } from 'react'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
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
import { createAdminUser, fetchAdminUser, updateAdminUser } from '../api/adminUsersApi.js'
import { fetchOrgTree, fetchPositions } from '../api/responsiblePersonsApi.js'

/**
 * Верх правой панели админки: поля учётки и кнопка Добавить/Сохранить.
 * Пустой логин → только people; заполненный → add_user (bcrypt на бэкенде).
 *
 * @param {{
 *   peopleId: number | null,
 *   mode?: 'view' | 'add',
 *   onSaved?: (peopleId: number) => void,
 *   positionsTick?: number,
 * }} props
 */
export default function AdminUserFormPanel({
  peopleId,
  mode = 'view',
  onSaved,
  positionsTick = 0,
}) {
  const isAdding = mode === 'add'
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)
  const [fio, setFio] = useState('')
  const [fioReports, setFioReports] = useState('')
  const [fioRodPad, setFioRodPad] = useState('')
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
    setFioReports('')
    setFioRodPad('')
    setOraName('')
    setPassword('')
    setDtEnter('')
    setDtOut('')
    setNote('')
    setActive(false)
    setUsersId(null)
    setError(null)
    setLoading(false)
    setSaving(false)
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
        setFioReports(data.fioreports ?? '')
        setFioRodPad(data.fiorodpad ?? '')
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
        setFioReports('')
        setFioRodPad('')
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

  // positionsTick: справочник должностей изменился, пока форма add уже открыта
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
  }, [isAdding, positionsTick])

  const disabled = !isAdding && (peopleId == null || loading)
  const loginFilled = oraName.trim() !== ''
  const activeDisabled = disabled || !loginFilled
  const title = isAdding
    ? 'Добавление пользователя'
    : peopleId == null
      ? 'Пользователь не выбран'
      : usersId != null
        ? `Пользователь #${usersId}`
        : `Человек #${peopleId} (без учётки)`

  const canSave = (() => {
    if (saving || loading) return false
    if (!fio.trim()) return false
    if (isAdding) {
      if (!dateIn || orgId === '' || doljId === '') return false
    } else if (peopleId == null) {
      return false
    }
    return true
  })()

  const showSaveButton = isAdding || peopleId != null

  const handleOraNameChange = (event) => {
    const value = event.target.value
    setOraName(value)
    if (!value.trim()) setActive(false)
  }

  const handleSave = async () => {
    // Add: people_add, затем add_user только при логине. Edit: people + опционально учётка.
    if (!canSave) return
    setSaving(true)
    setError(null)
    const body = {
      fio: fio.trim(),
      fioreports: fioReports.trim(),
      fiorodpad: fioRodPad.trim(),
      oraName: oraName.trim(),
      password,
      active: loginFilled ? active : false,
      note,
      dtEnter: dtEnter || null,
      dtOut: dtOut || null,
    }
    if (isAdding) {
      body.dateIn = dateIn
      body.orgId = Number(orgId)
      body.doljId = Number(doljId)
    }
    try {
      if (isAdding) {
        const created = await createAdminUser(body)
        onSaved?.(created.id)
      } else {
        await updateAdminUser(peopleId, body)
        const data = await fetchAdminUser(peopleId)
        setUsersId(data.usersId ?? null)
        setFio(data.fio ?? '')
        setFioReports(data.fioreports ?? '')
        setFioRodPad(data.fiorodpad ?? '')
        setOraName(data.oraName ?? '')
        setDtEnter(data.dtEnter ? String(data.dtEnter).slice(0, 10) : '')
        setDtOut(data.dtOut ? String(data.dtOut).slice(0, 10) : '')
        setNote(data.note ?? '')
        setActive(data.active === 1)
        setPassword('')
        onSaved?.(peopleId)
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Ошибка сохранения')
    } finally {
      setSaving(false)
    }
  }

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

      <TextField
        size="small"
        label="Инициалы, фамилия"
        value={fioReports}
        onChange={(e) => setFioReports(e.target.value)}
        fullWidth
        disabled={disabled}
      />

      <TextField
        size="small"
        label="Инициалы, фамилия (в родительном падеже)"
        value={fioRodPad}
        onChange={(e) => setFioRodPad(e.target.value)}
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
        onChange={handleOraNameChange}
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
        helperText={
          isAdding || usersId == null
            ? 'Если пусто и логин задан — пароль 123'
            : 'Если пусто — пароль не меняется'
        }
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
              disabled={activeDisabled}
            />
          }
          label="Активен"
        />
      </Box>

      {showSaveButton && (
        <Box>
          <Button
            variant="contained"
            disableElevation
            disabled={!canSave}
            onClick={handleSave}
            sx={{ textTransform: 'none', fontWeight: 600 }}
          >
            {isAdding ? 'Добавить' : 'Сохранить'}
          </Button>
        </Box>
      )}
    </Stack>
  )
}
