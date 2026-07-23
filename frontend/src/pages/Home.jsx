import { useCallback, useEffect, useRef, useState } from 'react'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import FormControl from '@mui/material/FormControl'
import FormControlLabel from '@mui/material/FormControlLabel'
import Radio from '@mui/material/Radio'
import RadioGroup from '@mui/material/RadioGroup'
import AddIcon from '@mui/icons-material/Add'
import EditOutlinedIcon from '@mui/icons-material/EditOutlined'
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline'
import { format, startOfMonth } from 'date-fns'
import { AxiosProvider, BaseTable, DynamicDateList } from 'mainComponent'
import { fetchNaryadyPeriods } from '../api/naryadyApi.js'
import { naryadColumns } from './naryadColumns.js'

/** Режимы отбора по датам — как rgDate в Delphi NarListUnit. */
const DATE_MODE_OPTIONS = [
  { value: 0, label: 'Создание наряда' },
  { value: 1, label: 'План. начало бурения' },
  { value: 2, label: 'Начало бурения' },
  { value: 3, label: 'Учетные периоды' },
  { value: 4, label: 'Закрытие наряда' },
]

const SIDEBAR_FILTER_IDS = new Set(['dateMode', 'period'])

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
 * dateMode/period уходят в query через filters; колоночные фильтры — из таблицы.
 */
export default function Home() {
  const [dateMode, setDateMode] = useState(0)
  const [selectedDate, setSelectedDate] = useState(currentMonthStart)
  const [dates, setDates] = useState([])
  const [filters, setFiltersState] = useState(() => [
    { id: 'dateMode', value: 0 },
    { id: 'period', value: currentMonthStart() },
  ])

  // Актуальные dateMode/period для inject при setFilters из BaseTable (иначе stale closure)
  const sidebarRef = useRef({ dateMode, selectedDate })
  sidebarRef.current = { dateMode, selectedDate }

  const injectSidebarFilters = useCallback((list) => {
    const { dateMode: mode, selectedDate: period } = sidebarRef.current
    const columnOnly = (list || []).filter((f) => !SIDEBAR_FILTER_IDS.has(f.id))
    return [
      ...columnOnly,
      { id: 'dateMode', value: mode },
      { id: 'period', value: period },
    ]
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

  // При смене месяца/режима подмешиваем period в filters без сброса колоночных
  useEffect(() => {
    setFiltersState((prev) => injectSidebarFilters(prev))
  }, [dateMode, selectedDate, injectSidebarFilters])

  // Дерево месяцев с бэка при смене режима; выбор текущего месяца или fallback
  useEffect(() => {
    let cancelled = false
    fetchNaryadyPeriods(dateMode)
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
  }, [dateMode])

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
        <FormControl
          component="fieldset"
          sx={{ px: 1.5, pt: 1.5, pb: 0.5, flexShrink: 0 }}
        >
          <RadioGroup
            value={String(dateMode)}
            onChange={(e) => setDateMode(Number(e.target.value))}
          >
            {DATE_MODE_OPTIONS.map((opt) => (
              <FormControlLabel
                key={opt.value}
                value={String(opt.value)}
                control={<Radio size="small" />}
                label={opt.label}
                TypographyProps={{ variant: 'body2' }}
                sx={{ m: 0 }}
              />
            ))}
          </RadioGroup>
        </FormControl>

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
