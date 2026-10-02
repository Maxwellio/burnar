import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import Box from '@mui/material/Box'
import IconButton from '@mui/material/IconButton'
import Popover from '@mui/material/Popover'
import TextField from '@mui/material/TextField'
import Tooltip from '@mui/material/Tooltip'
import Colorize from '@mui/icons-material/Colorize'
import FormatColorReset from '@mui/icons-material/FormatColorReset'
import { AxiosProvider, BaseTable, BaseTreeTable } from 'mainComponent'
import { fetchNaryadAlgorithm, updateNaryadRowColor } from '../api/naryadyApi.js'
import { useAlert } from '../context/ConfirmContext.jsx'
import {
  ACTION_BAR_HEIGHT,
  RIGHT_PANEL_DEFAULT_RATIO,
  clampRightPanelWidth,
  persistTableColumnSizing,
  readStoredRightPanelWidth,
  seedTableColumnSizing,
  writeStoredRightPanelWidth,
} from './naryadPageLayout.js'
import {
  nodeIdFilters,
  selectedNodeStatusText,
} from './naryadWorkspaceData.js'
import {
  NARYAD_COLOR_SWATCHES,
  NARYAD_DEFAULT_PICKER_COLOR,
  canChangeRowColor,
  colorOverrideBaseline,
  cssColorToDelphi,
  rowBackgroundColor,
  withRowColorOverride,
  withoutUnsavedColorOverride,
} from './naryadRowColors.js'

/** Пустое поле — несколько строк; дальше высота растёт по тексту, лишнее прокручивается внутри рамки. */
const ALG_FIELD_MIN_ROWS = 4
const ALG_FIELD_MAX_ROWS = 12

const actionButtonSx = {
  height: '100%',
  width: ACTION_BAR_HEIGHT,
  borderRadius: 0,
  borderRight: 1,
  borderColor: 'divider',
  color: 'text.secondary',
}

/**
 * Раскладка одной вкладки: дерево / сплиттер / параметры + алгоритм.
 * Задание и выполнение — разные экземпляры, чтобы ресайз колонок не тёк.
 * Ширины колонок и правой панели — в localStorage (стабильные ключи, не id наряда).
 * Параметры и алгоритм — по выбранной строке (Delphi ReadOpParams, типы 79/80).
 */
export default function NaryadWorkspacePanel({
  actionBarAriaLabel,
  naryadId,
  part,
  closed,
  treeUrl,
  treeColumns,
  paramsUrl,
  algorithmUrl,
  paramColumns,
  rightPanelStorageKey,
  treeSizingKey,
  paramsSizingKey,
}) {
  const showAlert = useAlert()
  const colorInputRef = useRef(null)
  const mutationPendingRef = useRef(false)
  const desiredColorRef = useRef(null)
  const customPreviewBaselineRef = useRef(null)
  const ignoreCustomInputRef = useRef(false)
  const preferredWidthRef = useRef(readStoredRightPanelWidth(rightPanelStorageKey))
  const seededRef = useRef(false)
  if (!seededRef.current) {
    seedTableColumnSizing(treeUrl, treeSizingKey)
    seedTableColumnSizing(paramsUrl, paramsSizingKey)
    seededRef.current = true
  }

  const [treeFilters, setTreeFilters] = useState([])
  const [selectedId, setSelectedId] = useState(null)
  const [algorithm, setAlgorithm] = useState('')
  const [colorOverrides, setColorOverrides] = useState(() => new Map())
  const [clearSelectionSignal, setClearSelectionSignal] = useState(0)
  const [mutationPending, setMutationPending] = useState(false)
  const [colorMenuAnchor, setColorMenuAnchor] = useState(null)
  const [colorTooltipOpen, setColorTooltipOpen] = useState(false)
  const [resetTooltipOpen, setResetTooltipOpen] = useState(false)
  const paramFilters = useMemo(() => nodeIdFilters(selectedId), [selectedId])
  const treeStatusText = selectedNodeStatusText(selectedId)
  const colorActionsEnabled = canChangeRowColor(selectedId, closed, mutationPending)
  const selectedIdRef = useRef(selectedId)
  const closedRef = useRef(closed)
  const colorOverridesRef = useRef(colorOverrides)
  selectedIdRef.current = selectedId
  closedRef.current = closed
  colorOverridesRef.current = colorOverrides
  const containerRef = useRef(null)
  const dragRef = useRef(null)
  const [rightWidth, setRightWidth] = useState(() => preferredWidthRef.current)
  const [dragging, setDragging] = useState(false)

  useEffect(() => {
    setSelectedId(null)
    setAlgorithm('')
    setColorOverrides(new Map())
    setColorMenuAnchor(null)
  }, [treeUrl])

  useEffect(() => {
    if (selectedId == null || closed === true) setColorMenuAnchor(null)
  }, [selectedId, closed])

  useEffect(() => {
    if (colorMenuAnchor || !colorActionsEnabled) {
      setColorTooltipOpen(false)
      setResetTooltipOpen(false)
    }
  }, [colorMenuAnchor, colorActionsEnabled])

  useEffect(() => {
    let cancelled = false
    if (selectedId == null || !algorithmUrl) {
      setAlgorithm('')
      return undefined
    }
    fetchNaryadAlgorithm(algorithmUrl, selectedId)
      .then((data) => {
        if (!cancelled) setAlgorithm(data?.text ?? '')
      })
      .catch(() => {
        if (!cancelled) setAlgorithm('')
      })
    return () => {
      cancelled = true
    }
  }, [algorithmUrl, selectedId])

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

  const revertCustomPreview = () => {
    const baseline = customPreviewBaselineRef.current
    customPreviewBaselineRef.current = null
    if (!baseline) return
    setColorOverrides((current) => withoutUnsavedColorOverride(current, baseline))
  }

  const drainColorSaves = async () => {
    if (mutationPendingRef.current) return false
    const job = desiredColorRef.current
    if (!job) return false
    if (!canChangeRowColor(job.nodeId, closedRef.current, false)) {
      desiredColorRef.current = null
      return false
    }
    desiredColorRef.current = null
    mutationPendingRef.current = true
    setMutationPending(true)
    let saved = false
    try {
      const updated = await updateNaryadRowColor(naryadId, part, job.nodeId, job.color)
      setColorOverrides((current) => {
        if (desiredColorRef.current) return current
        return withRowColorOverride(current, job.nodeId, updated.color)
      })
      // Синяя подсветка скрывает фон, но строка остаётся целью кнопок:
      // цвет можно подбирать повторно, не выбирая её заново.
      setClearSelectionSignal((signal) => signal + 1)
      if (job.closeMenu) setColorMenuAnchor(null)
      if (!desiredColorRef.current) customPreviewBaselineRef.current = null
      saved = true
    } catch {
      if (!desiredColorRef.current) revertCustomPreview()
      void showAlert('Не удалось изменить цвет строки.')
    } finally {
      mutationPendingRef.current = false
      setMutationPending(false)
    }
    if (desiredColorRef.current) void drainColorSavesRef.current()
    return saved
  }
  const drainColorSavesRef = useRef(drainColorSaves)
  drainColorSavesRef.current = drainColorSaves

  const changeSelectedRowColor = (color, { closeMenu = true } = {}) => {
    if (!canChangeRowColor(selectedId, closed, false)) return Promise.resolve(false)
    if (closeMenu) customPreviewBaselineRef.current = null
    desiredColorRef.current = { color, closeMenu, nodeId: selectedId }
    return drainColorSaves()
  }

  const previewCustomColor = (css) => {
    if (ignoreCustomInputRef.current) return
    const nodeId = selectedIdRef.current
    if (!canChangeRowColor(nodeId, closedRef.current, false)) return
    let color
    try {
      color = cssColorToDelphi(css)
    } catch {
      return
    }
    if (!customPreviewBaselineRef.current) {
      customPreviewBaselineRef.current = colorOverrideBaseline(colorOverridesRef.current, nodeId)
    }
    setColorOverrides((current) => withRowColorOverride(current, nodeId, color))
    setClearSelectionSignal((signal) => signal + 1)
    desiredColorRef.current = { color, closeMenu: false, nodeId }
    void drainColorSavesRef.current()
  }

  const colorChangeListenerRef = useRef(null)
  const bindColorInput = useCallback((node) => {
    const previous = colorInputRef.current
    if (previous === node) return
    if (previous && colorChangeListenerRef.current) {
      previous.removeEventListener('change', colorChangeListenerRef.current)
    }
    colorInputRef.current = node
    if (!node) {
      colorChangeListenerRef.current = null
      return
    }
    // change приходит, когда системный селектор уже закрыт. До этого input
    // только показывает оттенок и не должен размонтировать поле.
    const commit = (event) => {
      const css = event.target.value
      ignoreCustomInputRef.current = true
      event.target.value = NARYAD_DEFAULT_PICKER_COLOR
      ignoreCustomInputRef.current = false
      let color
      try {
        color = cssColorToDelphi(css)
      } catch {
        return
      }
      desiredColorRef.current = {
        color,
        closeMenu: true,
        nodeId: selectedIdRef.current,
      }
      void drainColorSavesRef.current()
    }
    colorChangeListenerRef.current = commit
    node.addEventListener('change', commit)
  }, [])

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
          display: 'flex',
          alignItems: 'stretch',
          bgcolor: 'background.paper',
          borderBottom: 1,
          borderColor: 'divider',
        }}
      >
        <Tooltip
          title="Выделить строку цветом"
          open={colorTooltipOpen && !colorMenuAnchor && colorActionsEnabled}
          onOpen={() => {
            if (!colorMenuAnchor && colorActionsEnabled) setColorTooltipOpen(true)
          }}
          onClose={() => setColorTooltipOpen(false)}
          disableFocusListener
        >
          <Box component="span" sx={{ display: 'inline-flex', position: 'relative' }}>
            <IconButton
              aria-label="Выделить строку цветом"
              aria-haspopup="dialog"
              aria-expanded={Boolean(colorMenuAnchor)}
              disabled={!colorActionsEnabled}
              onClick={(event) => {
                setColorTooltipOpen(false)
                setColorMenuAnchor(event.currentTarget)
              }}
              sx={actionButtonSx}
            >
              <Colorize />
            </IconButton>
            <Popover
              open={Boolean(colorMenuAnchor)}
              anchorEl={colorMenuAnchor}
              onClose={() => setColorMenuAnchor(null)}
              disableAutoFocus
              disableEnforceFocus
              disableRestoreFocus
              anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
              transformOrigin={{ vertical: 'top', horizontal: 'left' }}
            >
              <Box
                aria-label="Образцы цвета"
                sx={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(5, 28px)',
                  gap: 0.75,
                  p: 1,
                }}
              >
                {NARYAD_COLOR_SWATCHES.map((swatch) => (
                  <Box
                    key={swatch.css}
                    component="button"
                    type="button"
                    aria-label={swatch.label}
                    onClick={() => {
                      setColorMenuAnchor(null)
                      void changeSelectedRowColor(cssColorToDelphi(swatch.css))
                    }}
                    sx={{
                      width: 28,
                      height: 28,
                      p: 0,
                      borderRadius: 0.5,
                      border: 1,
                      borderColor: 'divider',
                      bgcolor: swatch.css,
                      cursor: 'pointer',
                    }}
                  />
                ))}
              </Box>
              <Box
                sx={{
                  position: 'relative',
                  borderTop: 1,
                  borderColor: 'divider',
                }}
              >
                <Box
                  component="span"
                  sx={{
                    display: 'block',
                    pl: '52px',
                    pr: 1.5,
                    py: 1,
                    pointerEvents: 'none',
                    color: 'text.primary',
                    fontSize: '0.875rem',
                    lineHeight: '28px',
                  }}
                >
                  Свой цвет
                </Box>
                {/* Поле накрывает всю строку, поэтому клик по надписи тоже открывает
                    селектор. Это по-прежнему прямой клик по видимому input, не скрипт. */}
                <Box
                  ref={bindColorInput}
                  component="input"
                  type="color"
                  defaultValue={NARYAD_DEFAULT_PICKER_COLOR}
                  aria-label="Свой цвет"
                  onClick={(event) => {
                    // Чёрный перед диалогом, чтобы повторный жёлтый тоже был изменением.
                    event.currentTarget.value = '#000000'
                  }}
                  onInput={(event) => {
                    previewCustomColor(event.currentTarget.value)
                  }}
                  sx={{
                    position: 'absolute',
                    inset: 0,
                    width: '100%',
                    height: '100%',
                    m: 0,
                    p: 0,
                    border: 0,
                    opacity: 1,
                    cursor: 'pointer',
                    bgcolor: 'transparent',
                    appearance: 'none',
                    '&:hover': { bgcolor: 'action.hover' },
                    '&::-webkit-color-swatch-wrapper': {
                      position: 'relative',
                      p: 0,
                      width: '100%',
                      height: '100%',
                    },
                    '&::-webkit-color-swatch': {
                      position: 'absolute',
                      left: 12,
                      top: '50%',
                      transform: 'translateY(-50%)',
                      width: 28,
                      height: 28,
                      border: '1px solid rgba(0, 0, 0, 0.12)',
                      borderRadius: 0.5,
                    },
                  }}
                />
              </Box>
            </Popover>
          </Box>
        </Tooltip>
        <Tooltip
          title="Сбросить цвет"
          open={resetTooltipOpen && colorActionsEnabled}
          onOpen={() => {
            if (colorActionsEnabled) setResetTooltipOpen(true)
          }}
          onClose={() => setResetTooltipOpen(false)}
          disableFocusListener
        >
          <Box component="span" sx={{ display: 'inline-flex' }}>
            <IconButton
              aria-label="Сбросить цвет"
              disabled={!colorActionsEnabled}
              onClick={() => {
                setResetTooltipOpen(false)
                void changeSelectedRowColor(0)
              }}
              sx={actionButtonSx}
            >
              <FormatColorReset />
            </IconButton>
          </Box>
        </Tooltip>
      </Box>

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
                setSelectedId={setSelectedId}
                getRowBackgroundColor={(row) => rowBackgroundColor(row, colorOverrides)}
                clearSelectionSignal={clearSelectionSignal}
                initialState={{ pagination: { pageIndex: 0, pageSize: 10000 } }}
              />
            </Box>
            <Box
              role="status"
              aria-live="polite"
              sx={{
                height: 32,
                flexShrink: 0,
                display: 'flex',
                alignItems: 'center',
                px: 1.5,
                boxSizing: 'border-box',
                borderTop: 1,
                borderColor: 'divider',
                bgcolor: '#F1F3F5',
                color: '#364FC7',
                fontSize: '0.875rem',
                fontWeight: 600,
                whiteSpace: 'nowrap',
              }}
            >
              {treeStatusText}
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
                setFilters={() => {}}
              />
            </Box>
            <Box
              sx={{
                flex: '0 1 auto',
                minHeight: 0,
                overflow: 'auto',
                px: 1,
                py: 0.75,
                boxSizing: 'border-box',
                borderTop: 1,
                borderColor: 'divider',
                bgcolor: 'background.paper',
              }}
            >
              <TextField
                value={algorithm}
                multiline
                fullWidth
                size="small"
                minRows={ALG_FIELD_MIN_ROWS}
                maxRows={ALG_FIELD_MAX_ROWS}
                InputProps={{ readOnly: true }}
                inputProps={{ 'aria-label': 'Алгоритм', 'aria-readonly': true }}
                sx={{
                  '& .MuiInputBase-root': {
                    alignItems: 'flex-start',
                  },
                  '& textarea': {
                    overflow: 'auto !important',
                    resize: 'none',
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
