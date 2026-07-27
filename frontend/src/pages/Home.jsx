import { useCallback, useEffect, useRef, useState } from 'react'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import FormControl from '@mui/material/FormControl'
import InputLabel from '@mui/material/InputLabel'
import MenuItem from '@mui/material/MenuItem'
import Select from '@mui/material/Select'
import ToggleButton from '@mui/material/ToggleButton'
import ToggleButtonGroup from '@mui/material/ToggleButtonGroup'
import AddIcon from '@mui/icons-material/Add'
import DateRangeIcon from '@mui/icons-material/DateRange'
import EditOutlinedIcon from '@mui/icons-material/EditOutlined'
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline'
import { format, startOfMonth } from 'date-fns'
import { AxiosProvider, BaseTable, DynamicDateList } from 'mainComponent'
import { fetchNaryadyPeriods } from '../api/naryadyApi.js'
import { fetchOrgUnits } from '../api/orgUnitsApi.js'
import { useAuth } from '../context/AuthContext.jsx'
import { isAdmin } from '../utils/roles.js'
import { naryadColumns } from './naryadColumns.js'

/** Режимы отбора по датам — как rgDate в Delphi NarListUnit. */
const DATE_MODE_OPTIONS = [
  { value: 0, label: 'Создание наряда' },
  { value: 1, label: 'План. начало бурения' },
  { value: 2, label: 'Начало бурения' },
  { value: 3, label: 'Учетные периоды' },
  { value: 4, label: 'Закрытие наряда' },
]

/** Sentinel «Все» — не уходит в query как orgUnitId. */
const ORG_ALL = 'all'

const SIDEBAR_FILTER_IDS = new Set(['dateMode', 'period', 'orgUnitId'])

/** Скрытый ползунок при сохранении прокрутки (Firefox / IE / WebKit). */
const HIDDEN_SCROLLBAR_SX = {
  scrollbarWidth: 'none',
  msOverflowStyle: 'none',
  '&::-webkit-scrollbar': { display: 'none' },
  // На случай внутренних скролл-контейнеров DynamicDateList
  '& *': {
    scrollbarWidth: 'none',
    msOverflowStyle: 'none',
  },
  '& *::-webkit-scrollbar': { display: 'none' },
}

const currentMonthStart = () => format(startOfMonth(new Date()), 'yyyy-MM-dd')

/** Есть ли yyyy-MM-dd в дереве { year, month[] }. */
const periodExistsInTree = (dates, yyyyMmDd) => {
  if (!yyyyMmDd || yyyyMmDd.length < 7) return false
  const year = Number(yyyyMmDd.slice(0, 4))
  const month = String(Number(yyyyMmDd.slice(5, 7)))
  const node = dates.find((d) => d.year === year)
  return Boolean(node?.month?.map(String).includes(month))
}

/** Fallback как в Delphi: текущий месяц, иначе последний в дереве. */
const pickPeriod = (dates, preferred) => {
  if (periodExistsInTree(dates, preferred)) return preferred
  const now = currentMonthStart()
  if (periodExistsInTree(dates, now)) return now
  if (!dates.length) return now
  const lastYear = dates[dates.length - 1]
  const lastMonth = lastYear.month[lastYear.month.length - 1]
  return format(new Date(lastYear.year, Number(lastMonth) - 1, 1), 'yyyy-MM-dd')
}

/**
 * Список нарядов: слева отбор по месяцу (DynamicDateList), справа тулбар + BaseTable.
 * dateMode/period/orgUnitId уходят в query через filters; колоночные фильтры — из таблицы.
 * Select «структура» — только ROLE_ADMIN.
 * Layout: боковая панель вплотную слева на всю высоту main (без заголовка «Наряды»).
 */
export default function Home() {
  const { user } = useAuth()
  const admin = isAdmin(user)

  const [dateMode, setDateMode] = useState(0)
  const [selectedDate, setSelectedDate] = useState(currentMonthStart)
  const [dates, setDates] = useState([])
  const [orgUnitId, setOrgUnitId] = useState(ORG_ALL)
  const [orgUnits, setOrgUnits] = useState([])
  const [orgSelectVisible, setOrgSelectVisible] = useState(false)
  const [filters, setFiltersState] = useState(() => [
    { id: 'dateMode', value: 0 },
    { id: 'period', value: currentMonthStart() },
  ])

  // Актуальные сайдбар/орг фильтры для inject при setFilters из BaseTable
  const sidebarRef = useRef({ dateMode, selectedDate, orgUnitId, admin })
  sidebarRef.current = { dateMode, selectedDate, orgUnitId, admin }

  const injectSidebarFilters = useCallback((list) => {
    const {
      dateMode: mode,
      selectedDate: period,
      orgUnitId: orgId,
      admin: isAdm,
    } = sidebarRef.current
    const columnOnly = (list || []).filter((f) => !SIDEBAR_FILTER_IDS.has(f.id))
    const next = [
      ...columnOnly,
      { id: 'dateMode', value: mode },
      { id: 'period', value: period },
    ]
    if (isAdm && orgId !== ORG_ALL) {
      next.push({ id: 'orgUnitId', value: Number(orgId) })
    }
    return next
  }, [])

  const setFilters = useCallback(
    (updater) => {
      setFiltersState((prev) => {
        const next = typeof updater === 'function' ? updater(prev) : updater
        return injectSidebarFilters(next)
      })
    },
    [injectSidebarFilters],
  )

  // При смене месяца/режима/орг подмешиваем filters без сброса колоночных
  useEffect(() => {
    setFiltersState((prev) => injectSidebarFilters(prev))
  }, [dateMode, selectedDate, orgUnitId, admin, injectSidebarFilters])

  // Справочник оргединиц — только админам
  useEffect(() => {
    if (!admin) {
      setOrgUnits([])
      setOrgSelectVisible(false)
      setOrgUnitId(ORG_ALL)
      return undefined
    }
    let cancelled = false
    fetchOrgUnits()
      .then((list) => {
        if (cancelled) return
        setOrgUnits(Array.isArray(list) ? list : [])
        setOrgSelectVisible(true)
      })
      .catch(() => {
        if (cancelled) return
        setOrgUnits([])
        setOrgSelectVisible(false)
      })
    return () => {
      cancelled = true
    }
  }, [admin])

  // Дерево месяцев с бэка при смене режима/орг; выбор текущего месяца или fallback
  useEffect(() => {
    let cancelled = false
    const orgParam =
      admin && orgUnitId !== ORG_ALL ? Number(orgUnitId) : undefined
    fetchNaryadyPeriods(dateMode, orgParam)
      .then((tree) => {
        if (cancelled) return
        setDates(Array.isArray(tree) ? tree : [])
        setSelectedDate((prev) => pickPeriod(Array.isArray(tree) ? tree : [], prev))
      })
      .catch(() => {
        if (cancelled) return
        setDates([])
      })
    return () => {
      cancelled = true
    }
  }, [dateMode, orgUnitId, admin])

  return (
    <Box
      sx={{
        height: '100%',
        display: 'flex',
        boxSizing: 'border-box',
        minHeight: 0,
        overflow: 'hidden',
        bgcolor: 'background.default',
      }}
    >
      {/* Боковая панель: вплотную слева под шапкой на всю высоту main */}
      <Box
        sx={{
          width: 200,
          flexShrink: 0,
          alignSelf: 'stretch',
          display: 'flex',
          flexDirection: 'column',
          minHeight: 0,
          bgcolor: 'background.paper',
          borderRight: 1,
          borderColor: 'divider',
          overflow: 'hidden',
        }}
      >
        {/* Режимы rgDate: копия UI ParameterSelector из mainComponent (пакет не трогаем) */}
        <Box sx={{ px: 1, pt: 1.5, pb: 1, flexShrink: 0, width: '100%', boxSizing: 'border-box' }}>
          <ToggleButtonGroup
            value={String(dateMode)}
            exclusive
            // exclusive: повторный клик даёт null — игнорируем, чтобы не сбросить dateMode
            onChange={(_e, next) => {
              if (next !== null) setDateMode(Number(next))
            }}
            orientation="vertical"
            fullWidth
            size="small"
            sx={{
              '& .MuiToggleButton-root': {
                justifyContent: 'flex-start',
                textAlign: 'left',
                color: 'black',
                fontSize: '0.75rem',
                lineHeight: 1.3,
                px: 1,
                py: 0.75,
                textTransform: 'none',
              },
              '& .MuiToggleButton-root.Mui-selected': {
                color: '#1976d2',
                backgroundColor: '#D0EBFF',
                '&:hover': {
                  backgroundColor: '#B1D7FF',
                },
              },
            }}
          >
            {DATE_MODE_OPTIONS.map((opt) => (
              <ToggleButton key={opt.value} value={String(opt.value)}>
                <DateRangeIcon sx={{ mr: 1, fontSize: 18 }} />
                {opt.label}
              </ToggleButton>
            ))}
          </ToggleButtonGroup>
        </Box>

        <Box
          sx={{
            flex: 1,
            minHeight: 0,
            overflow: 'auto',
            px: 0.5,
            ...HIDDEN_SCROLLBAR_SX,
          }}
        >
          <DynamicDateList
            dates={dates}
            selectedDate={selectedDate}
            setSelectedDate={setSelectedDate}
          />
        </Box>
      </Box>

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

          {orgSelectVisible && (
            <FormControl
              size="small"
              sx={{ ml: 'auto', minWidth: 180, bgcolor: 'background.paper' }}
            >
              <InputLabel id="org-structure-label">структура</InputLabel>
              <Select
                labelId="org-structure-label"
                id="org-structure-select"
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
    </Box>
  )
}
