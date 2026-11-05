import KeyboardArrowDown from '@mui/icons-material/KeyboardArrowDown'
import KeyboardArrowUp from '@mui/icons-material/KeyboardArrowUp'
import Refresh from '@mui/icons-material/Refresh'
import Box from '@mui/material/Box'
import IconButton from '@mui/material/IconButton'
import Table from '@mui/material/Table'
import TableBody from '@mui/material/TableBody'
import TableCell from '@mui/material/TableCell'
import TableContainer from '@mui/material/TableContainer'
import TableHead from '@mui/material/TableHead'
import TableRow from '@mui/material/TableRow'
import Tooltip from '@mui/material/Tooltip'
import { useEffect, useRef, useState } from 'react'
import { fetchVipolneniePeriodTotals } from '../../../api/naryadyApi.js'
import { useAlert } from '../../../context/ConfirmContext.jsx'
import {
  PERIOD_TOTALS_PANEL_HEIGHT,
  PERIOD_TOTAL_COLUMNS,
  formatPeriodHours,
  initialPeriodTotalsState,
  periodTotalsFailed,
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

/**
 * Строка состояния выполнения и раскрываемая таблица итогов по периодам.
 * Первое раскрытие читает GET .../period-totals, кнопка справа перечитывает его.
 */
export default function PeriodTotalsPanel({ naryadId, items }) {
  const showAlert = useAlert()
  const requestRef = useRef(0)
  const sessionRef = useRef(initialPeriodTotalsState())
  const [session, setSession] = useState(initialPeriodTotalsState)
  const [rows, setRows] = useState(null)

  useEffect(() => {
    requestRef.current += 1
    const fresh = initialPeriodTotalsState()
    sessionRef.current = fresh
    setSession(fresh)
    setRows(null)
  }, [naryadId])

  function remember(next) {
    sessionRef.current = next
    return next
  }

  async function load() {
    const token = ++requestRef.current
    try {
      const data = await fetchVipolneniePeriodTotals(naryadId)
      if (token !== requestRef.current) return
      setRows(Array.isArray(data) ? data : [])
      setSession((current) => remember(periodTotalsSucceeded(current)))
    } catch (error) {
      if (token !== requestRef.current) return
      setSession((current) => remember(periodTotalsFailed(current)))
      void showAlert(error?.message || 'Не удалось прочитать итоги по периодам')
    }
  }

  function apply(transition) {
    const result = transition(sessionRef.current)
    setSession(remember(result.state))
    if (result.fetch) void load()
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
        <Box component="span" sx={{ display: 'inline-flex' }}>
          <IconButton
            aria-label="Обновить итоги"
            disabled={session.loading}
            onClick={() => apply(reloadPeriodTotals)}
            sx={iconSx}
          >
            <Refresh />
          </IconButton>
        </Box>
      </Tooltip>
    </Box>
  )

  return (
    <>
      {session.open ? (
        <Box
          sx={{
            height: PERIOD_TOTALS_PANEL_HEIGHT,
            flexShrink: 0,
            display: 'flex',
            flexDirection: 'column',
            boxSizing: 'border-box',
            borderTop: 1,
            borderColor: 'divider',
            bgcolor: '#fff',
            minWidth: 0,
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
          <TableContainer sx={{ flex: 1, minHeight: 0 }}>
            <Table size="small" stickyHeader aria-label="Итоги по периодам" aria-busy={session.loading}>
              <TableHead>
                <TableRow>
                  {PERIOD_TOTAL_COLUMNS.map((column) => (
                    <TableCell
                      key={column.id}
                      align={column.numeric ? 'right' : 'left'}
                      sx={{ fontWeight: 600, whiteSpace: 'nowrap' }}
                    >
                      {column.title}
                    </TableCell>
                  ))}
                </TableRow>
              </TableHead>
              <TableBody>
                {rows == null ? (
                  <TableRow>
                    <TableCell colSpan={PERIOD_TOTAL_COLUMNS.length}>Загрузка…</TableCell>
                  </TableRow>
                ) : (
                  rows.map((row) => (
                    <TableRow key={row.periodKey ?? 'unassigned'}>
                      {PERIOD_TOTAL_COLUMNS.map((column) => (
                        <TableCell
                          key={column.id}
                          align={column.numeric ? 'right' : 'left'}
                          sx={{ whiteSpace: 'nowrap' }}
                        >
                          {column.numeric ? formatPeriodHours(row[column.id]) : (row.name ?? '')}
                        </TableCell>
                      ))}
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </Box>
      ) : null}
      <TreeStatusBar items={items} actions={actions} />
    </>
  )
}
