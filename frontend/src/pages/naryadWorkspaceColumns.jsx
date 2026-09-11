import Box from '@mui/material/Box'
import IconButton from '@mui/material/IconButton'
import Add from '@mui/icons-material/Add'
import Remove from '@mui/icons-material/Remove'

/** Отступ одного уровня (~32px), как в каталоге тематических разделов. */
const LEVEL_INDENT = 4
const EXPANDER_SIZE = 30

function WorkNameCell({ row, getValue }) {
  return (
    <Box sx={{ display: 'flex', alignItems: 'center', minWidth: 0, minHeight: EXPANDER_SIZE }}>
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
      <Box
        component="span"
        sx={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}
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

/** Колонки дерева без «Факт»/«Период»; каждый вызов — новые объекты (ресайз не течёт между вкладками). */
function makePlanTreeColumns(prefix) {
  return [
    col(prefix, 'id', 'Код', 70),
    col(prefix, 'ord', '№ п/п', 80),
    col(prefix, 'nm', 'Название работы', 250, { cell: WorkNameCell }),
    col(prefix, 'begoperdate', 'Время начала', 140),
    col(prefix, 'istnorm', 'Источник норм.', 140),
    col(prefix, 'ot', 'от', 50),
    col(prefix, 'do_', 'до', 50),
    col(prefix, 'n1', 'Н.в. на ед.', 90),
    col(prefix, 'n2', 'Н.в. на объём', 110),
    col(prefix, 'tipbur', 'ЭКС', 80),
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
export const naryadZadanieColumns = makePlanTreeColumns('zad')

/** Как у задания, плюс видимые Delphi-поля «Факт» и «Период». */
export const naryadVipolnenieColumns = (() => {
  const plan = makePlanTreeColumns('vip')
  return [
    ...plan.slice(0, -1),
    col('vip', 'fact', 'Факт', 70),
    plan[plan.length - 1],
    col('vip', 'period_nm', 'Период', 180),
  ]
})()

/** Параметры операции задания (Delphi GrdParams). */
export const naryadZadanieParamColumns = makeParamColumns('zadp')

/** Параметры операции выполнения — отдельный массив, без общих ссылок с заданием. */
export const naryadVipolnenieParamColumns = makeParamColumns('vipp')
