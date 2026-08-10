import { useCallback, useState } from 'react'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Typography from '@mui/material/Typography'
import AddIcon from '@mui/icons-material/Add'
import EditOutlinedIcon from '@mui/icons-material/EditOutlined'
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline'
import LockResetIcon from '@mui/icons-material/LockReset'
import { AxiosProvider, BaseTable } from 'mainComponent'
import AdminUserFormPanel from './AdminUserFormPanel.jsx'
import { adminUserColumns } from './adminUserColumns.jsx'
import { careerColumns } from './responsiblePersonColumns.jsx'

const buttonOutlinedSx = {
  textTransform: 'none',
  bgcolor: 'background.paper',
  borderColor: 'divider',
  color: 'text.secondary',
}

/**
 * Админ-панель: слева users BaseTable, справа всегда форма + карьеры.
 * Кнопки пока без логики — карта будущих действий в docs/admin-panel-notes.md.
 */
export default function Admin() {
  const [selectedPeopleId, setSelectedPeopleId] = useState(null)
  const [, setSelectedCareerId] = useState(null)
  const [usersFilters, setUsersFilters] = useState([])

  const handleSelectPeople = useCallback((id) => {
    setSelectedPeopleId(id)
    setSelectedCareerId(null)
  }, [])

  const hasPerson = selectedPeopleId != null

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
            disabled
            sx={{ textTransform: 'none', fontWeight: 600 }}
          >
            Добавить
          </Button>
          <Button
            variant="outlined"
            startIcon={<EditOutlinedIcon />}
            disabled
            sx={buttonOutlinedSx}
          >
            Редактировать
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
            startIcon={<LockResetIcon />}
            disabled
            sx={buttonOutlinedSx}
          >
            Сменить пароль
          </Button>
        </Box>

        <Box sx={{ flex: 1, minHeight: 0 }}>
          <AxiosProvider baseapi="/api">
            <BaseTable
              url="/admin/users"
              columns={adminUserColumns}
              filters={usersFilters}
              setFilters={setUsersFilters}
              setSelectedId={handleSelectPeople}
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
          <AdminUserFormPanel peopleId={selectedPeopleId} />
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
              disabled
              sx={{ textTransform: 'none', fontWeight: 600 }}
            >
              Добавить
            </Button>
            <Button
              variant="outlined"
              startIcon={<EditOutlinedIcon />}
              disabled
              sx={buttonOutlinedSx}
            >
              Редактировать
            </Button>
            <Button
              variant="outlined"
              startIcon={<DeleteOutlineIcon />}
              disabled
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
    </Box>
  )
}
