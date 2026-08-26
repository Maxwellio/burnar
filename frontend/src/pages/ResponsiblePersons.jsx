import { useCallback, useEffect, useMemo, useState } from 'react'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import FormControl from '@mui/material/FormControl'
import InputLabel from '@mui/material/InputLabel'
import MenuItem from '@mui/material/MenuItem'
import Select from '@mui/material/Select'
import Typography from '@mui/material/Typography'
import AddIcon from '@mui/icons-material/Add'
import EditOutlinedIcon from '@mui/icons-material/EditOutlined'
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline'
import { AxiosProvider, BaseTable } from 'mainComponent'
import {
  deleteCareer,
  deleteResponsiblePerson,
  fetchCareerDeleteBlock,
  fetchCareerTotal,
  fetchPersonDeleteBlock,
  fetchResponsiblePersonOrgUnits,
} from '../api/responsiblePersonsApi.js'
import { useAuth } from '../context/AuthContext.jsx'
import { useAlert, useConfirm } from '../context/ConfirmContext.jsx'
import { isAdmin } from '../utils/roles.js'
import { runCareerDelete, runPersonDelete } from '../utils/deleteWithMasterGuard.js'
import CareerFormDialog from './CareerFormDialog.jsx'
import PeopleFormDialog from './PeopleFormDialog.jsx'
import { careerColumns, peopleColumns } from './responsiblePersonColumns.jsx'

/** Sentinel «Все» — не уходит в query как orgUnitId (как на главной). */
const ORG_ALL = 'all'

const buttonOutlinedSx = {
  textTransform: 'none',
  bgcolor: 'background.paper',
  borderColor: 'divider',
  color: 'text.secondary',
}

/**
 * Master-detail: слева people (CRUD), справа карьеры (CRUD через karjera_add / DELETE).
 * Select «структура» — только ROLE_ADMIN.
 */
export default function ResponsiblePersons() {
  const { user } = useAuth()
  const confirm = useConfirm()
  const showAlert = useAlert()
  const admin = isAdmin(user)

  const [selectedPeopleId, setSelectedPeopleId] = useState(null)
  const [selectedCareerId, setSelectedCareerId] = useState(null)
  const [orgUnitId, setOrgUnitId] = useState(ORG_ALL)
  const [orgUnits, setOrgUnits] = useState([])
  const [orgSelectVisible, setOrgSelectVisible] = useState(false)
  const [peopleFilters, setPeopleFilters] = useState([])
  const [peopleRenderSignal, setPeopleRenderSignal] = useState(0)
  const [careerRenderSignal, setCareerRenderSignal] = useState(0)

  const [peopleFormOpen, setPeopleFormOpen] = useState(false)
  const [peopleFormMode, setPeopleFormMode] = useState('add')

  const [careerFormOpen, setCareerFormOpen] = useState(false)
  const [careerFormMode, setCareerFormMode] = useState('add')

  // Админский cut орг.: как на Home — в filters BaseTable → query orgUnitId
  const injectOrgFilter = useCallback(
    (list) => {
      const withoutOrg = (list || []).filter((f) => f.id !== 'orgUnitId')
      if (admin && orgUnitId !== ORG_ALL) {
        return [...withoutOrg, { id: 'orgUnitId', value: Number(orgUnitId) }]
      }
      return withoutOrg
    },
    [admin, orgUnitId],
  )

  const setPeopleFiltersSafe = useCallback(
    (updater) => {
      setPeopleFilters((prev) => {
        const next = typeof updater === 'function' ? updater(prev) : updater
        return injectOrgFilter(next)
      })
    },
    [injectOrgFilter],
  )

  useEffect(() => {
    setPeopleFilters((prev) => injectOrgFilter(prev))
    setSelectedPeopleId(null)
    setSelectedCareerId(null)
  }, [orgUnitId, admin, injectOrgFilter])

  // Смена человека слева сбрасывает выбор карьеры
  const handleSelectPeople = useCallback((id) => {
    setSelectedPeopleId(id)
    setSelectedCareerId(null)
  }, [])

  useEffect(() => {
    if (!admin) {
      setOrgUnits([])
      setOrgSelectVisible(false)
      setOrgUnitId(ORG_ALL)
      return undefined
    }
    let cancelled = false
    fetchResponsiblePersonOrgUnits()
      .then((list) => {
        if (cancelled) return
        setOrgUnits(Array.isArray(list) ? list : [])
        setOrgSelectVisible(true)
      })
      .catch(() => {
        if (!cancelled) {
          setOrgUnits([])
          setOrgSelectVisible(false)
        }
      })
    return () => {
      cancelled = true
    }
  }, [admin])

  const hasPerson = selectedPeopleId != null
  const hasCareer = selectedCareerId != null

  const careerFilters = useMemo(() => {
    if (admin && orgUnitId !== ORG_ALL) {
      return [{ id: 'orgUnitId', value: Number(orgUnitId) }]
    }
    return []
  }, [admin, orgUnitId])

  const handleAddPerson = () => {
    setPeopleFormMode('add')
    setPeopleFormOpen(true)
  }

  const handleEditPerson = () => {
    if (!hasPerson) return
    setPeopleFormMode('edit')
    setPeopleFormOpen(true)
  }

  const handlePersonSaved = ({ id }) => {
    if (id != null) {
      setSelectedPeopleId(id)
    }
    setPeopleRenderSignal((n) => n + 1)
    setCareerRenderSignal((n) => n + 1)
  }

  const handleDeletePerson = async () => {
    if (!admin || !hasPerson) return
    const deleted = await runPersonDelete({
      peopleId: selectedPeopleId,
      fetchBlock: fetchPersonDeleteBlock,
      confirm,
      alert: showAlert,
      deletePerson: deleteResponsiblePerson,
    })
    if (!deleted) return
    setSelectedPeopleId(null)
    setSelectedCareerId(null)
    setPeopleRenderSignal((n) => n + 1)
  }

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

  const handleDeleteCareer = async () => {
    if (!hasPerson || !hasCareer) return
    const result = await runCareerDelete({
      peopleId: selectedPeopleId,
      careerId: selectedCareerId,
      fetchBlock: fetchCareerDeleteBlock,
      fetchCareerTotal,
      confirm,
      alert: showAlert,
      deleteCareer,
    })
    if (!result.deleted) return
    setSelectedCareerId(null)
    setCareerRenderSignal((n) => n + 1)
    if (result.isOnlyCareer) {
      setSelectedPeopleId(null)
      setPeopleRenderSignal((n) => n + 1)
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
      {/* Левая панель: люди */}
      <Box
        sx={{
          flex: 1,
          minWidth: 0,
          minHeight: 0,
          display: 'flex',
          flexDirection: 'column',
          gap: 2,
          p: 2.5,
          overflow: 'hidden',
          borderRight: { md: 1 },
          borderColor: { md: 'divider' },
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
            onClick={handleAddPerson}
            sx={{ textTransform: 'none', fontWeight: 600 }}
          >
            Добавить
          </Button>
          <Button
            variant="outlined"
            startIcon={<EditOutlinedIcon />}
            disabled={!hasPerson}
            onClick={handleEditPerson}
            sx={buttonOutlinedSx}
          >
            Редактировать
          </Button>
          {admin && (
            <Button
              variant="outlined"
              startIcon={<DeleteOutlineIcon />}
              disabled={!hasPerson}
              onClick={handleDeletePerson}
              sx={buttonOutlinedSx}
            >
              Удалить
            </Button>
          )}

          {orgSelectVisible && (
            <FormControl
              size="small"
              sx={{ ml: 'auto', minWidth: 180, bgcolor: 'background.paper' }}
            >
              <InputLabel id="rp-org-structure-label">структура</InputLabel>
              <Select
                labelId="rp-org-structure-label"
                id="rp-org-structure-select"
                label="структура"
                value={orgUnitId}
                onChange={(e) => setOrgUnitId(e.target.value)}
              >
                <MenuItem value={ORG_ALL}>Все</MenuItem>
                {orgUnits.map((u) => (
                  <MenuItem key={u.id} value={String(u.id)}>
                    {u.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          )}
        </Box>

        <Box sx={{ flex: 1, minHeight: 0 }}>
          <AxiosProvider baseapi="/api">
            <BaseTable
              url="/responsible-persons"
              columns={peopleColumns}
              filters={peopleFilters}
              setFilters={setPeopleFiltersSafe}
              setSelectedId={handleSelectPeople}
              reRenderSignal={peopleRenderSignal}
              pageable
            />
          </AxiosProvider>
        </Box>
      </Box>

      {/* Правая панель: карьеры */}
      <Box
        sx={{
          flex: 1,
          minWidth: 0,
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
                key={`${selectedPeopleId}-${orgUnitId}`}
                url={`/responsible-persons/${selectedPeopleId}/careers`}
                columns={careerColumns}
                filters={careerFilters}
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
                Выберите ответственное лицо слева, чтобы увидеть карьеры
              </Typography>
            </Box>
          )}
        </Box>
      </Box>

      <PeopleFormDialog
        open={peopleFormOpen}
        mode={peopleFormMode}
        peopleId={peopleFormMode === 'edit' ? selectedPeopleId : null}
        onClose={() => setPeopleFormOpen(false)}
        onSaved={handlePersonSaved}
      />

      <CareerFormDialog
        open={careerFormOpen}
        mode={careerFormMode}
        peopleId={selectedPeopleId}
        careerKey={careerFormMode === 'edit' ? selectedCareerId : null}
        onClose={() => setCareerFormOpen(false)}
        onSaved={handleCareerSaved}
      />
    </Box>
  )
}
