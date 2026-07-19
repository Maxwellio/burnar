import { useState } from 'react'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import TextField from '@mui/material/TextField'
import Typography from '@mui/material/Typography'
import InputAdornment from '@mui/material/InputAdornment'
import AddIcon from '@mui/icons-material/Add'
import EditOutlinedIcon from '@mui/icons-material/EditOutlined'
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline'
import SearchIcon from '@mui/icons-material/Search'
import { AxiosProvider, BaseTable } from 'mainComponent'
import { naryadColumns } from './naryadColumns.js'

/**
 * Список нарядов: заголовок, тулбар (добавить/редактировать/удалить + поиск) и таблица.
 * Кнопки и поиск пока только визуально; цвета из theme.
 */
export default function Home() {
  const [filters, setFilters] = useState([])
  const [search, setSearch] = useState('')

  return (
    <Box
      sx={{
        p: 2.5,
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        boxSizing: 'border-box',
        minHeight: 0,
        gap: 2,
        bgcolor: 'background.default',
      }}
    >
      <Typography
        variant="h5"
        sx={{ fontWeight: 700, color: 'text.primary', flexShrink: 0 }}
      >
        Наряды
      </Typography>

      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 2,
          flexWrap: 'wrap',
          flexShrink: 0,
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            disableElevation
            sx={{ textTransform: 'none', fontWeight: 600 }}
          >
            Добавить
          </Button>
          <Button
            variant="outlined"
            startIcon={<EditOutlinedIcon />}
            sx={{
              textTransform: 'none',
              bgcolor: 'background.paper',
              borderColor: 'divider',
              color: 'text.secondary',
            }}
          >
            Редактировать
          </Button>
          <Button
            variant="outlined"
            startIcon={<DeleteOutlineIcon />}
            sx={{
              textTransform: 'none',
              bgcolor: 'background.paper',
              borderColor: 'divider',
              color: 'text.secondary',
            }}
          >
            Удалить
          </Button>
        </Box>

        <TextField
          size="small"
          placeholder="Поиск по нарядам..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          sx={{
            width: { xs: '100%', sm: 320 },
            bgcolor: 'background.paper',
            '& .MuiOutlinedInput-root': {
              borderRadius: 2,
              '& fieldset': { borderColor: 'divider' },
            },
          }}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon color="action" />
              </InputAdornment>
            ),
          }}
        />
      </Box>

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
