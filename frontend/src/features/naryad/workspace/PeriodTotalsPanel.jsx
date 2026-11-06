import KeyboardArrowDown from '@mui/icons-material/KeyboardArrowDown'
import KeyboardArrowUp from '@mui/icons-material/KeyboardArrowUp'
import Refresh from '@mui/icons-material/Refresh'
import Box from '@mui/material/Box'
import IconButton from '@mui/material/IconButton'
import Tooltip from '@mui/material/Tooltip'
import { BaseTable } from 'mainComponent'
import { useEffect, useMemo, useRef, useState } from 'react'
import { COLUMN_SIZING_KEYS, naryadCompactTableSx } from '../naryadPageLayout.js'
import PanelSplitter from './layout/PanelSplitter.jsx'
import useColumnSizingPersistence from './layout/useColumnSizingPersistence.js'
import usePeriodTotalsHeight from './layout/usePeriodTotalsHeight.js'
import {
  initialPeriodTotalsState,
  periodTotalColumnDefs,
  periodTotalsSucceeded,
  reloadPeriodTotals,
  togglePeriodTotals,
} from './periodTotals.js'
import TreeStatusBar from './TreeStatusBar.jsx'

const iconSx = {
  width: 32,
  height: 32,
  borderRadius: 0,
  color: 'inherit',
}

const NO_FILTERS = []
const ignoreFilters = () => {}

/**
 * Строка состояния выполнения и раскрываемая таблица итогов по периодам.
 * Таблица — BaseTable, как параметры наряда. Первое чтение и пересчёт
 * идут через reRenderSignal, повторное раскрытие таблицу не монтирует заново.
 */
export default function PeriodTotalsPanel({ naryadId, items }) {
  const sessionRef = useRef(initialPeriodTotalsState())
  const [session, setSession] = useState(initialPeriodTotalsState)
  const [activated, setActivated] = useState(false)
  const [reloadSignal, setReloadSignal] = useState(0)
  const columns = useMemo(() => periodTotalColumnDefs(), [])
  const url = `/naryady/${naryadId}/vipolnenie/period-totals`
  const totalsHeight = usePeriodTotalsHeight()
  useColumnSizingPersistence([[url, COLUMN_SIZING_KEYS.vipolneniePeriodTotals]])

  useEffect(() => {
    const fresh = initialPeriodTotalsState()
    sessionRef.current = fresh
    setSession(fresh)
    setActivated(false)
    setReloadSignal(0)
  }, [naryadId])

  function remember(next) {
    sessionRef.current = next
    return next
  }

  function apply(transition) {
    const result = transition(sessionRef.current)
    const next = result.fetch ? periodTotalsSucceeded(result.state) : result.state
    setSession(remember(next))
    if (result.fetch) {
      setActivated(true)
      setReloadSignal((value) => value + 1)
    }
  }

  const actions = (
    <Box sx={{ display: 'flex', alignItems: 'stretch', flexShrink: 0 }}>
      <Tooltip title={session.open ? 'Скрыть итоги' : 'Показать итоги'}>
        <IconButton
          aria-label={session.open ? 'Скрыть итоги' : 'Показать итоги'}
          aria-expanded={session.open}
          onClick={() => apply(togglePeriodTotals)}
          sx={iconSx}
        >
          {session.open ? <KeyboardArrowDown /> : <KeyboardArrowUp />}
        </IconButton>
      </Tooltip>
      <Tooltip title="Обновить итоги">
        <IconButton
          aria-label="Обновить итоги"
          onClick={() => apply(reloadPeriodTotals)}
          sx={iconSx}
        >
          <Refresh />
        </IconButton>
      </Tooltip>
    </Box>
  )

  return (
    <Box ref={totalsHeight.anchorRef} sx={{ display: 'contents' }}>
      {session.open ? (
        <PanelSplitter
          orientation="horizontal"
          ariaLabel="Высота итогов по периодам"
          dragging={totalsHeight.dragging}
          onPointerDown={totalsHeight.onPointerDown}
        />
      ) : null}
      {activated ? (
        <Box
          sx={{
            height: session.open ? totalsHeight.height : 0,
            flexShrink: 0,
            display: 'flex',
            flexDirection: 'column',
            boxSizing: 'border-box',
            overflow: 'hidden',
            minWidth: 0,
            ...(session.open
              ? { borderTop: 1, borderColor: 'divider', bgcolor: '#fff' }
              : null),
          }}
        >
          <Box
            sx={{
              px: 1.5,
              py: 0.5,
              flexShrink: 0,
              fontWeight: 600,
              fontSize: '0.875rem',
              color: '#364FC7',
            }}
          >
            Итоги по периодам
          </Box>
          <Box
            aria-label="Итоги по периодам"
            sx={{ flex: 1, minHeight: 0, minWidth: 0, overflow: 'hidden', ...naryadCompactTableSx }}
          >
            <BaseTable
              url={url}
              columns={columns}
              filters={NO_FILTERS}
              setFilters={ignoreFilters}
              reRenderSignal={reloadSignal}
            />
          </Box>
        </Box>
      ) : null}
      <TreeStatusBar items={items} actions={actions} />
    </Box>
  )
}
