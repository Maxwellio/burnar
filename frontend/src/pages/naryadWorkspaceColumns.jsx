import Box from '@mui/material/Box'
import IconButton from '@mui/material/IconButton'
import Add from '@mui/icons-material/Add'
import Remove from '@mui/icons-material/Remove'
import { Bell, Calculator, FolderTree, Link2, SquareArrowOutUpRight } from 'lucide-react'
import {
  naryadCorrelationIconName,
  naryadLockIconName,
  naryadOperIconName,
} from './naryadOperIcons.js'

/** Отступ одного уровня (~32px), как в каталоге тематических разделов. */
const LEVEL_INDENT = 4
const EXPANDER_SIZE = 30
const OPER_ICON_SIZE = 24

/** Имена из naryadOperIconName → компоненты lucide-react 0.469.0. */
const OPER_TYPE_ICONS = {
  calculator: Calculator,
  'square-arrow-out-up-right': SquareArrowOutUpRight,
  'folder-tree': FolderTree,
}

const OPER_TYPE_LABELS = {
  calculator: 'Комбинация или алгоритм',
  'square-arrow-out-up-right': 'Ненормируемая работа',
  'folder-tree': 'Структура',
}

function OperTypeMark({ node }) {
  const name = naryadOperIconName(node)
  const Icon = name ? OPER_TYPE_ICONS[name] : null
  if (!Icon) return null
  return (
    <Box
      component="span"
      role="img"
      title={OPER_TYPE_LABELS[name]}
      aria-label={OPER_TYPE_LABELS[name]}
      sx={{
        display: 'inline-flex',
        alignItems: 'center',
        flexShrink: 0,
        height: EXPANDER_SIZE,
        mr: 0.75,
        color: 'text.secondary',
      }}
    >
      <Icon size={OPER_ICON_SIZE} aria-hidden />
    </Box>
  )
}

function WorkNameCell({ row, getValue }) {
  return (
    <Box sx={{ display: 'flex', alignItems: 'flex-start', minWidth: 0, minHeight: EXPANDER_SIZE }}>
      {row.depth > 0 ? (
        <Box
          aria-hidden
          sx={{
            width: (theme) => theme.spacing(LEVEL_INDENT * row.depth),
            flexShrink: 0,
          }}
        />
      ) : null}
      {row.getCanExpand() ? (
        <IconButton
          size="small"
          disableRipple
          aria-label={row.getIsExpanded() ? 'Свернуть' : 'Развернуть'}
          onClick={(e) => {
            e.stopPropagation()
            row.getToggleExpandedHandler()()
          }}
          sx={{
            p: 0,
            mr: 0.75,
            width: EXPANDER_SIZE,
            height: EXPANDER_SIZE,
            color: 'text.primary',
            borderRadius: 0,
            backgroundColor: 'transparent',
            '&:hover': { backgroundColor: 'transparent' },
            '&:focus': { backgroundColor: 'transparent' },
            '&:active': { backgroundColor: 'transparent' },
          }}
        >
          {row.getIsExpanded() ? (
            <Remove sx={{ fontSize: 26 }} />
          ) : (
            <Add sx={{ fontSize: 26 }} />
          )}
        </IconButton>
      ) : (
        <Box sx={{ width: EXPANDER_SIZE, flexShrink: 0, mr: 0.75 }} />
      )}
      <OperTypeMark node={row.original} />
      <Box
        component="span"
        sx={{ minWidth: 0, whiteSpace: 'normal' }}
      >
        {getValue() ?? ''}
      </Box>
    </Box>
  )
}

function col(prefix, accessorKey, header, size, extra = {}) {
  return {
    id: `${prefix}_${accessorKey}`,
    accessorKey,
    header,
    size,
    enableColumnFilter: false,
    ...extra,
  }
}

/** Общая ячейка шапки над несколькими колонками. BaseTreeTable рисует её как в BaseTable. */
function group(prefix, id, header, columns) {
  return {
    id: `${prefix}_${id}`,
    header,
    columns,
  }
}

function MarkedValueCell({ getValue, iconName, Icon, label, color = 'text.secondary' }) {
  const text = getValue() ?? ''
  if (!iconName) {
    return text
  }
  return (
    <Box sx={{ display: 'flex', alignItems: 'flex-start', minWidth: 0 }}>
      <Box
        component="span"
        role="img"
        title={label}
        aria-label={label}
        sx={{
          display: 'inline-flex',
          alignItems: 'center',
          flexShrink: 0,
          height: EXPANDER_SIZE,
          mr: 0.75,
          color,
        }}
      >
        <Icon size={OPER_ICON_SIZE} aria-hidden />
      </Box>
      <Box component="span" sx={{ minWidth: 0, whiteSpace: 'normal' }}>
        {text}
      </Box>
    </Box>
  )
}

/** Image5: замок выполнения в «№ п/п». На задании этой картинки нет. */
function VipOrdCell({ row, getValue }) {
  return (
    <MarkedValueCell
      getValue={getValue}
      iconName={naryadLockIconName(row.original)}
      Icon={Link2}
      label="Работа заблокирована"
    />
  )
}

/** Image4: правило корреляции в «Н.в. на объём», красный колокольчик. */
function VipNormVolumeCell({ row, getValue }) {
  return (
    <MarkedValueCell
      getValue={getValue}
      iconName={naryadCorrelationIconName(row.original)}
      Icon={Bell}
      label="Есть правило корреляции"
      color="error.main"
    />
  )
}

/**
 * Колонки дерева без «Факт»/«Период»; каждый вызов — новые объекты (ресайз не течёт между вкладками).
 * vipMarks включает Image4/Image5 только у выполнения.
 */
function makePlanTreeColumns(prefix, { vipMarks = false } = {}) {
  return [
    col(prefix, 'id', 'Код', 70),
    col(prefix, 'ord', '№ п/п', vipMarks ? 120 : 80, vipMarks ? { cell: VipOrdCell } : {}),
    col(prefix, 'nm', 'Название работы', 250, { cell: WorkNameCell }),
    col(prefix, 'begoperdate', 'Время начала', 140),
    col(prefix, 'istnorm', 'Источник норм.', 140),
    group(prefix, 'interval', 'Интервал', [
      col(prefix, 'ot', 'от', 50),
      col(prefix, 'do_', 'до', 50),
    ]),
    group(prefix, 'norm', 'Норма времени', [
      col(prefix, 'n1', 'Н.в. на ед.', 90),
      col(prefix, 'n2', 'Н.в. на объём', vipMarks ? 150 : 110, vipMarks ? { cell: VipNormVolumeCell } : {}),
    ]),
  ]
}

function makeParamColumns(prefix) {
  return [
    col(prefix, 'nm', 'Параметр', 140),
    col(prefix, 'val', 'Значение', 100),
  ]
}

/**
 * Колонки дерева задания (Delphi trGrdNar, видимые).
 * Expander в «Название работы» — в BaseTreeTable шеврона нет.
 */
export const naryadZadanieColumns = [
  ...makePlanTreeColumns('zad'),
  // col('zad', 'tipbur', 'ЭКС', 80),
]

/** Как у задания, плюс «Факт» сразу после нормы времени и перед «Период». */
export const naryadVipolnenieColumns = [
  ...makePlanTreeColumns('vip', { vipMarks: true }),
  col('vip', 'fact', 'Факт', 70),
  // col('vip', 'tipbur', 'ЭКС', 80),
  col('vip', 'period_nm', 'Период', 180),
]

/** Параметры операции задания (Delphi GrdParams). */
export const naryadZadanieParamColumns = makeParamColumns('zadp')

/** Параметры операции выполнения — отдельный массив, без общих ссылок с заданием. */
export const naryadVipolnenieParamColumns = makeParamColumns('vipp')
