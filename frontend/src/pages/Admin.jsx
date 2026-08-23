import { useCallback, useEffect, useState } from 'react'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Checkbox from '@mui/material/Checkbox'
import FormControlLabel from '@mui/material/FormControlLabel'
import Typography from '@mui/material/Typography'
import AddIcon from '@mui/icons-material/Add'
import EditOutlinedIcon from '@mui/icons-material/EditOutlined'
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline'
import { AxiosProvider, BaseTable } from 'mainComponent'
import { deleteCareer, fetchCareerTotal } from '../api/responsiblePersonsApi.js'
import { useConfirm } from '../context/ConfirmContext.jsx'
import AdminUserFormPanel from './AdminUserFormPanel.jsx'
import CareerFormDialog from './CareerFormDialog.jsx'
import PositionsDictionaryDialog from './PositionsDictionaryDialog.jsx'
import { adminUserColumns } from './adminUserColumns.jsx'
import { careerColumns } from './responsiblePersonColumns.jsx'

const buttonOutlinedSx = {
  textTransform: 'none',
  bgcolor: 'background.paper',
  borderColor: 'divider',
  color: 'text.secondary',
}

const FILTER_IDS = ['accountKind', 'activeKind']

/**
 * Админ-панель: слева users BaseTable, справа форма учётки + карьеры.
 * Чекбоксы списка → query accountKind / activeKind (см. docs/admin-panel-notes.md).
 * CRUD карьер — тот же API/диалог, что на «Ответственных лицах»;
 * «Добавить» слева открывает форму; «Должности» — модальный справочник sprdoljnost.
 */
export default function Admin() {
  const confirm = useConfirm()

  const [selectedPeopleId, setSelectedPeopleId] = useState(null)
  const [selectedCareerId, setSelectedCareerId] = useState(null)
  const [usersFilters, setUsersFilters] = useState([])
  const [usersRenderSignal, setUsersRenderSignal] = useState(0)
  const [careerRenderSignal, setCareerRenderSignal] = useState(0)
  const [accountKind, setAccountKind] = useState(null)
  const [activeKind, setActiveKind] = useState(null)

  const [careerFormOpen, setCareerFormOpen] = useState(false)
  const [careerFormMode, setCareerFormMode] = useState('add')
  const [isAddingUser, setIsAddingUser] = useState(false)
  const [addUserSession, setAddUserSession] = useState(0)
  const [positionsOpen, setPositionsOpen] = useState(false)
  const [positionsTick, setPositionsTick] = useState(0)

  const injectListFilters = useCallback(
    (list) => {
      const without = (list || []).filter((f) => !FILTER_IDS.includes(f.id))
      const next = [...without]
      if (accountKind) {
        next.push({ id: 'accountKind', value: accountKind })
      }
      if (activeKind) {
        next.push({ id: 'activeKind', value: activeKind })
      }
      return next
    },
    [accountKind, activeKind],
  )

  const setUsersFiltersSafe = useCallback(
    (updater) => {
      setUsersFilters((prev) => {
        const next = typeof updater === 'function' ? updater(prev) : updater
        return injectListFilters(next)
      })
    },
    [injectListFilters],
  )

  useEffect(() => {
    setUsersFilters((prev) => injectListFilters(prev))
  }, [injectListFilters])

  // Смена человека слева сбрасывает выбор карьеры и режим добавления
  const handleSelectPeople = useCallback((id) => {
    setIsAddingUser(false)
    setSelectedPeopleId(id)
    setSelectedCareerId(null)
  }, [])

  const handleAddUser = () => {
    setIsAddingUser(true)
    setSelectedPeopleId(null)
    setSelectedCareerId(null)
    setAddUserSession((n) => n + 1)
  }

  // После save: обновить левую таблицу и показать созданную/сохранённую карточку.
  const handleUserSaved = (peopleId) => {
    setUsersRenderSignal((n) => n + 1)
    setIsAddingUser(false)
    setSelectedPeopleId(peopleId)
    setSelectedCareerId(null)
  }

  const toggleAccountKind = useCallback((value) => {
    setAccountKind((prev) => (prev === value ? null : value))
    // Без учётки нет active — сбрасываем конфликтующую пару
    if (value === 'responsible') setActiveKind(null)
  }, [])

  const toggleActiveKind = useCallback((value) => {
    setActiveKind((prev) => (prev === value ? null : value))
    setAccountKind((prev) => (prev === 'responsible' ? null : prev))
  }, [])

  const hasPerson = selectedPeopleId != null
  const hasCareer = selectedCareerId != null

  const handleAddCareer = () => {
    if (!hasPerson) return
    setCareerFormMode('add')
    setCareerFormOpen(true)
  }

  const handleEditCareer = () => {
    if (!hasPerson || !hasCareer) return
    setCareerFormMode('edit')
    setCareerFormOpen(true)
  }

  const handleCareerSaved = () => {
    setCareerRenderSignal((n) => n + 1)
  }

  // Удаление карьеры: предупреждение про каскад people, если это последняя в БД
  const handleDeleteCareer = async () => {
    if (!hasPerson || !hasCareer) return
    let careerTotal
    try {
      // Без orgUnitId: триггер срабатывает по последней карьере в БД, не по видимым в фильтре
      careerTotal = await fetchCareerTotal(selectedPeopleId)
    } catch (e) {
      console.error(e)
      return
    }
    const isOnlyCareer = careerTotal === 1
    const message = isOnlyCareer
      ? 'Удалить выбранную карьеру пользователя? Вместе с ней будет удалён и сам пользователь.'
      : 'Удалить выбранную карьеру пользователя?'
    const ok = await confirm(message, { action: 'удаление' })
    if (!ok) return
    try {
      await deleteCareer(selectedPeopleId, selectedCareerId)
      setSelectedCareerId(null)
      setCareerRenderSignal((n) => n + 1)
      // Последняя карьера → пользователь исчезнет из JOIN-списка /admin/users
      if (isOnlyCareer) {
        setSelectedPeopleId(null)
        setUsersRenderSignal((n) => n + 1)
      }
    } catch (e) {
      console.error(e)
    }
  }

  return (
    <Box
      sx={{
        flex: 1,
        minHeight: 0,
        display: 'flex',
        flexDirection: { xs: 'column', md: 'row' },
        overflow: 'hidden',
      }}
    >
      {/* Левая панель: список пользователей */}
      <Box
        sx={{
          flex: { xs: '1 1 auto', md: '7 1 0' },
          minWidth: 0,
          minHeight: 0,
          display: 'flex',
          flexDirection: 'column',
          gap: 2,
          p: 2.5,
          overflow: 'hidden',
          borderRight: { md: 1 },
          borderBottom: { xs: 1, md: 0 },
          borderColor: 'divider',
        }}
      >
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            gap: 1,
            flexWrap: 'wrap',
            flexShrink: 0,
          }}
        >
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            disableElevation
            onClick={handleAddUser}
            sx={{ textTransform: 'none', fontWeight: 600 }}
          >
            Добавить
          </Button>
          <Button
            variant="outlined"
            startIcon={<DeleteOutlineIcon />}
            disabled
            sx={buttonOutlinedSx}
          >
            Удалить
          </Button>
          <Button
            variant="outlined"
            onClick={() => setPositionsOpen(true)}
            sx={buttonOutlinedSx}
          >
            Должности
          </Button>

          <FormControlLabel
            control={
              <Checkbox
                size="small"
                checked={accountKind === 'responsible'}
                onChange={() => toggleAccountKind('responsible')}
              />
            }
            label="Ответственные лица"
            sx={{ ml: 1, mr: 0 }}
          />
          <FormControlLabel
            control={
              <Checkbox
                size="small"
                checked={accountKind === 'users'}
                onChange={() => toggleAccountKind('users')}
              />
            }
            label="Пользователи"
            sx={{ mr: 0 }}
          />
          <FormControlLabel
            control={
              <Checkbox
                size="small"
                checked={activeKind === 'active'}
                onChange={() => toggleActiveKind('active')}
              />
            }
            label="Активные"
            sx={{ ml: 1, mr: 0 }}
          />
          <FormControlLabel
            control={
              <Checkbox
                size="small"
                checked={activeKind === 'inactive'}
                onChange={() => toggleActiveKind('inactive')}
              />
            }
            label="Неактивные"
            sx={{ mr: 0 }}
          />
        </Box>

        <Box sx={{ flex: 1, minHeight: 0 }}>
          <AxiosProvider baseapi="/api">
            <BaseTable
              url="/admin/users"
              columns={adminUserColumns}
              filters={usersFilters}
              setFilters={setUsersFiltersSafe}
              setSelectedId={handleSelectPeople}
              reRenderSignal={usersRenderSignal}
              pageable
            />
          </AxiosProvider>
        </Box>
      </Box>

      {/* Правая панель: форма сверху, карьеры снизу — всегда открыта */}
      <Box
        sx={{
          flex: { xs: '1 1 auto', md: '3.5 1 0' },
          minWidth: { md: 360 },
          minHeight: 0,
          display: 'flex',
          flexDirection: 'column',
          gap: 2,
          p: 2.5,
          overflow: 'hidden',
        }}
      >
        <Box
          sx={{
            flexShrink: 0,
            maxHeight: { xs: '45%', md: '48%' },
            overflow: 'auto',
            pr: 0.5,
          }}
        >
          <AdminUserFormPanel
            key={isAddingUser ? `add-${addUserSession}` : 'view'}
            peopleId={selectedPeopleId}
            mode={isAddingUser ? 'add' : 'view'}
            onSaved={handleUserSaved}
            positionsTick={positionsTick}
          />
        </Box>

        <Box
          sx={{
            flex: 1,
            minHeight: 0,
            display: 'flex',
            flexDirection: 'column',
            gap: 1.5,
            borderTop: 1,
            borderColor: 'divider',
            pt: 2,
          }}
        >
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              gap: 1,
              flexWrap: 'wrap',
              flexShrink: 0,
            }}
          >
            <Typography variant="subtitle2" color="text.secondary" sx={{ mr: 1 }}>
              Карьеры
            </Typography>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              disableElevation
              disabled={!hasPerson}
              onClick={handleAddCareer}
              sx={{ textTransform: 'none', fontWeight: 600 }}
            >
              Добавить
            </Button>
            <Button
              variant="outlined"
              startIcon={<EditOutlinedIcon />}
              disabled={!hasCareer}
              onClick={handleEditCareer}
              sx={buttonOutlinedSx}
            >
              Редактировать
            </Button>
            <Button
              variant="outlined"
              startIcon={<DeleteOutlineIcon />}
              disabled={!hasCareer}
              onClick={handleDeleteCareer}
              sx={buttonOutlinedSx}
            >
              Удалить
            </Button>
          </Box>

          <Box sx={{ flex: 1, minHeight: 0 }}>
            {hasPerson ? (
              <AxiosProvider baseapi="/api">
                <BaseTable
                  key={selectedPeopleId}
                  url={`/responsible-persons/${selectedPeopleId}/careers`}
                  columns={careerColumns}
                  setSelectedId={setSelectedCareerId}
                  reRenderSignal={careerRenderSignal}
                  pageable
                />
              </AxiosProvider>
            ) : (
              <Box
                sx={{
                  height: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  px: 2,
                }}
              >
                <Typography variant="body2" color="text.secondary" textAlign="center">
                  Выберите пользователя слева, чтобы увидеть карьеры
                </Typography>
              </Box>
            )}
          </Box>
        </Box>
      </Box>

      <CareerFormDialog
        open={careerFormOpen}
        mode={careerFormMode}
        peopleId={selectedPeopleId}
        careerKey={careerFormMode === 'edit' ? selectedCareerId : null}
        onClose={() => setCareerFormOpen(false)}
        onSaved={handleCareerSaved}
      />
      <PositionsDictionaryDialog
        open={positionsOpen}
        onClose={() => setPositionsOpen(false)}
        onChanged={() => setPositionsTick((n) => n + 1)}
      />
    </Box>
  )
}
