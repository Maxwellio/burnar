import { useCallback, useEffect, useRef, useState } from 'react'
import Box from '@mui/material/Box'
import TextField from '@mui/material/TextField'
import { AxiosProvider, BaseTable, BaseTreeTable } from 'mainComponent'
import {
  ACTION_BAR_HEIGHT,
  RIGHT_PANEL_DEFAULT_RATIO,
  clampRightPanelWidth,
  persistTableColumnSizing,
  readStoredRightPanelWidth,
  seedTableColumnSizing,
  writeStoredRightPanelWidth,
} from './naryadPageLayout.js'

const ALG_FIELD_HEIGHT = 120

/**
 * Раскладка одной вкладки: дерево / сплиттер / параметры + алгоритм.
 * Задание и выполнение — разные экземпляры, чтобы ресайз колонок не тёк.
 * Ширины колонок и правой панели — в localStorage (стабильные ключи, не id наряда).
 */
export default function NaryadWorkspacePanel({
  actionBarAriaLabel,
  treeUrl,
  treeColumns,
  paramsUrl,
  paramColumns,
  rightPanelStorageKey,
  treeSizingKey,
  paramsSizingKey,
}) {
  const preferredWidthRef = useRef(readStoredRightPanelWidth(rightPanelStorageKey))
  const seededRef = useRef(false)
  if (!seededRef.current) {
    seedTableColumnSizing(treeUrl, treeSizingKey)
    seedTableColumnSizing(paramsUrl, paramsSizingKey)
    seededRef.current = true
  }

  const [treeFilters, setTreeFilters] = useState([])
  const [paramFilters, setParamFilters] = useState([])
  const containerRef = useRef(null)
  const dragRef = useRef(null)
  const [rightWidth, setRightWidth] = useState(() => preferredWidthRef.current)
  const [dragging, setDragging] = useState(false)

  const persistColumns = useCallback(() => {
    persistTableColumnSizing(treeUrl, treeSizingKey)
    persistTableColumnSizing(paramsUrl, paramsSizingKey)
  }, [treeUrl, treeSizingKey, paramsUrl, paramsSizingKey])

  const applyWidth = useCallback((width) => {
    const containerWidth = containerRef.current?.clientWidth ?? 0
    if (!(containerWidth > 0)) return null
    const next = clampRightPanelWidth(width, containerWidth)
    preferredWidthRef.current = next
    setRightWidth(next)
    writeStoredRightPanelWidth(next, rightPanelStorageKey)
    return next
  }, [rightPanelStorageKey])

  useEffect(() => {
    const el = containerRef.current
    if (!el) return undefined

    const sync = () => {
      const cw = el.clientWidth
      if (!(cw > 0)) return
      setRightWidth(() => {
        const raw = preferredWidthRef.current ?? Math.round(cw * RIGHT_PANEL_DEFAULT_RATIO)
        return clampRightPanelWidth(raw, cw)
      })
    }

    sync()
    const observer = new ResizeObserver(sync)
    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  useEffect(() => {
    const onPointerUp = () => persistColumns()
    window.addEventListener('pointerup', onPointerUp)
    return () => {
      window.removeEventListener('pointerup', onPointerUp)
      persistColumns()
    }
  }, [persistColumns])

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
        aria-label={actionBarAriaLabel}
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
                columns={treeColumns}
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
                columns={paramColumns}
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
