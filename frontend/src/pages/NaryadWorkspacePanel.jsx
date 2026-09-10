import { useCallback, useEffect, useRef, useState } from 'react'
import Box from '@mui/material/Box'
import TextField from '@mui/material/TextField'
import { AxiosProvider, BaseTable, BaseTreeTable } from 'mainComponent'
import {
  ACTION_BAR_HEIGHT,
  RIGHT_PANEL_DEFAULT_RATIO,
  clampRightPanelWidth,
  readStoredRightPanelWidth,
  writeStoredRightPanelWidth,
} from './naryadPageLayout.js'
import {
  naryadParamColumns,
  naryadVipolnenieColumns,
  naryadZadanieColumns,
} from './naryadWorkspaceColumns.jsx'

const ALG_FIELD_HEIGHT = 120

const WORKSPACES = {
  zad: {
    actionBarAriaLabel: 'Панель действий задания',
    treeSegment: 'zadanie',
    treeColumns: naryadZadanieColumns,
  },
  vip: {
    actionBarAriaLabel: 'Панель действий выполнения',
    treeSegment: 'vipolnenie',
    treeColumns: naryadVipolnenieColumns,
  },
}

/**
 * Общая раскладка задания и выполнения: один экземпляр на карточку,
 * вкладка меняет только URL/колонки. Ширина правой панели общая, в localStorage.
 */
export default function NaryadWorkspacePanel({ kind, naryadId }) {
  const workspace = WORKSPACES[kind] ?? WORKSPACES.zad
  const treeUrl = `/naryady/${naryadId}/${workspace.treeSegment}`
  const paramsUrl = `${treeUrl}/params`

  const [treeFilters, setTreeFilters] = useState([])
  const [paramFilters, setParamFilters] = useState([])
  const containerRef = useRef(null)
  const dragRef = useRef(null)
  const [rightWidth, setRightWidth] = useState(() => readStoredRightPanelWidth())
  const [dragging, setDragging] = useState(false)

  const applyWidth = useCallback((width) => {
    const containerWidth = containerRef.current?.clientWidth ?? 0
    if (!(containerWidth > 0)) return null
    const next = clampRightPanelWidth(width, containerWidth)
    setRightWidth(next)
    writeStoredRightPanelWidth(next)
    return next
  }, [])

  useEffect(() => {
    const el = containerRef.current
    if (!el) return undefined

    const sync = () => {
      const cw = el.clientWidth
      if (!(cw > 0)) return
      setRightWidth((prev) => {
        const raw = prev ?? Math.round(cw * RIGHT_PANEL_DEFAULT_RATIO)
        const next = clampRightPanelWidth(raw, cw)
        if (next !== prev) writeStoredRightPanelWidth(next)
        return next
      })
    }

    sync()
    const observer = new ResizeObserver(sync)
    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  useEffect(() => {
    if (!dragging) return undefined
    const prevCursor = document.body.style.cursor
    const prevSelect = document.body.style.userSelect
    document.body.style.cursor = 'col-resize'
    document.body.style.userSelect = 'none'

    const onMove = (event) => {
      const drag = dragRef.current
      if (!drag) return
      applyWidth(drag.startWidth - (event.clientX - drag.startX))
    }
    const onUp = () => {
      dragRef.current = null
      setDragging(false)
    }

    window.addEventListener('pointermove', onMove)
    window.addEventListener('pointerup', onUp)
    return () => {
      window.removeEventListener('pointermove', onMove)
      window.removeEventListener('pointerup', onUp)
      document.body.style.cursor = prevCursor
      document.body.style.userSelect = prevSelect
    }
  }, [dragging, applyWidth])

  const onSplitterPointerDown = (event) => {
    if (event.button !== 0) return
    event.preventDefault()
    dragRef.current = {
      startX: event.clientX,
      startWidth: rightWidth ?? 0,
    }
    setDragging(true)
  }

  return (
    <Box
      sx={{
        flex: 1,
        minHeight: 0,
        minWidth: 0,
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
      }}
    >
      <Box
        aria-label={workspace.actionBarAriaLabel}
        sx={{
          height: ACTION_BAR_HEIGHT,
          flexShrink: 0,
          bgcolor: 'background.paper',
          borderBottom: 1,
          borderColor: 'divider',
        }}
      />

      <Box
        ref={containerRef}
        sx={{
          flex: 1,
          minHeight: 0,
          minWidth: 0,
          display: 'flex',
          overflow: 'hidden',
        }}
      >
        <AxiosProvider baseapi="/api">
          <Box
            sx={{
              flex: '1 1 0',
              minWidth: 0,
              minHeight: 0,
              display: 'flex',
              flexDirection: 'column',
              overflow: 'hidden',
            }}
          >
            <Box sx={{ flex: 1, minHeight: 0, minWidth: 0, overflow: 'hidden' }}>
              <BaseTreeTable
                url={treeUrl}
                columns={workspace.treeColumns}
                filters={treeFilters}
                setFilters={setTreeFilters}
                initialState={{ pagination: { pageIndex: 0, pageSize: 10000 } }}
              />
            </Box>
          </Box>

          <Box
            role="separator"
            aria-orientation="vertical"
            aria-label="Ширина панели параметров"
            onPointerDown={onSplitterPointerDown}
            sx={{
              width: 6,
              flexShrink: 0,
              cursor: 'col-resize',
              touchAction: 'none',
              bgcolor: dragging ? 'action.selected' : 'divider',
              '&:hover': { bgcolor: 'action.selected' },
            }}
          />

          <Box
            sx={{
              width: rightWidth ?? `${RIGHT_PANEL_DEFAULT_RATIO * 100}%`,
              flexShrink: 0,
              minWidth: 0,
              minHeight: 0,
              display: 'flex',
              flexDirection: 'column',
              overflow: 'hidden',
            }}
          >
            <Box sx={{ flex: 1, minHeight: 0, minWidth: 0, overflow: 'hidden' }}>
              <BaseTable
                url={paramsUrl}
                columns={naryadParamColumns}
                filters={paramFilters}
                setFilters={setParamFilters}
              />
            </Box>
            <Box
              sx={{
                height: ALG_FIELD_HEIGHT,
                flexShrink: 0,
                px: 1,
                py: 0.75,
                boxSizing: 'border-box',
                borderTop: 1,
                borderColor: 'divider',
                bgcolor: 'background.paper',
              }}
            >
              <TextField
                value=""
                multiline
                fullWidth
                size="small"
                InputProps={{ readOnly: true }}
                inputProps={{ 'aria-label': 'Алгоритм', 'aria-readonly': true }}
                sx={{
                  height: '100%',
                  '& .MuiInputBase-root': {
                    height: '100%',
                    alignItems: 'flex-start',
                    overflow: 'auto',
                  },
                  '& textarea': {
                    overflow: 'auto !important',
                  },
                }}
              />
            </Box>
          </Box>
        </AxiosProvider>
      </Box>
    </Box>
  )
}
