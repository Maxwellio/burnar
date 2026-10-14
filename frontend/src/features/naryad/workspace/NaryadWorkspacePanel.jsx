import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import Box from '@mui/material/Box'
import IconButton from '@mui/material/IconButton'
import Popover from '@mui/material/Popover'
import Tooltip from '@mui/material/Tooltip'
import FolderDelete from '@mui/icons-material/FolderDelete'
import Colorize from '@mui/icons-material/Colorize'
import DeleteOutline from '@mui/icons-material/DeleteOutline'
import FormatColorReset from '@mui/icons-material/FormatColorReset'
import LinkIcon from '@mui/icons-material/Link'
import LinkOffIcon from '@mui/icons-material/LinkOff'
import Lock from '@mui/icons-material/Lock'
import LockOpen from '@mui/icons-material/LockOpen'
import { AxiosProvider, BaseTreeTable } from 'mainComponent'
import {
  deleteNaryadBlock,
  deleteNaryadWorks,
  fetchNaryadAlgorithm,
  fetchNaryadTotals,
  fetchNaryadWorkAction,
  fetchNaryadWorkLocks,
  lockNaryadWorks,
  setNaryadPartClosed,
  unlockNaryadWorks,
  updateNaryadRowsColor,
} from '../../../api/naryadyApi.js'
import { useAlert, useConfirm } from '../../../context/ConfirmContext.jsx'
import ActionButton, { actionButtonSx } from './ActionButton.jsx'
import TreeStatusBar from './TreeStatusBar.jsx'
import WorkDetailsPanel from './WorkDetailsPanel.jsx'
import WorkspaceActionBar from './WorkspaceActionBar.jsx'
import PanelSplitter from './layout/PanelSplitter.jsx'
import useColumnSizingPersistence from './layout/useColumnSizingPersistence.js'
import useResizablePanel from './layout/useResizablePanel.js'
import { RIGHT_PANEL_DEFAULT_RATIO } from '../naryadPageLayout.js'
import {
  detailNodeId,
  nodeIdFilters,
  treeFooterStatusItems,
} from './naryadWorkspaceData.js'
import {
  DELETE_BLOCK_CONFIRM,
  DELETE_LOCKED_MESSAGE,
  DELETE_MARKED_CONFIRM,
  canDeleteBlock,
  canDeleteMarkedWorks,
  closeActionLabel,
  lockActionState,
  lockFlagMap,
  selectedLockRows,
  selectionHasLockedWork,
} from '../actions/naryadPartActions.js'
import {
  NARYAD_COLOR_SWATCHES,
  NARYAD_DEFAULT_PICKER_COLOR,
  NARYAD_RECENT_ROW_COLOR_LIMIT,
  canChangeRowColor,
  colorOverrideBaselines,
  cssColorToDelphi,
  readRecentRowColors,
  rememberRecentRowColor,
  rowBackgroundColor,
  withRowColorOverrides,
  withoutUnsavedColorOverrides,
  writeRecentRowColors,
} from '../actions/color/naryadRowColors.js'

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
  onClosedChange,
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
  const confirm = useConfirm()
  const colorInputRef = useRef(null)
  const mutationPendingRef = useRef(false)
  const desiredColorRef = useRef(null)
  const customPreviewBaselineRef = useRef(null)
  const ignoreCustomInputRef = useRef(false)
  useColumnSizingPersistence([
    [treeUrl, treeSizingKey],
    [paramsUrl, paramsSizingKey],
  ])
  const rightPanel = useResizablePanel(rightPanelStorageKey)

  const [treeFilters, setTreeFilters] = useState([])
  const [selectedIds, setSelectedIds] = useState([])
  const [lockFlags, setLockFlags] = useState(null)
  const [totals, setTotals] = useState(null)
  const [treeReload, setTreeReload] = useState(0)
  const [algorithm, setAlgorithm] = useState('')
  const [colorOverrides, setColorOverrides] = useState(() => new Map())
  const [clearSelectionSignal, setClearSelectionSignal] = useState(0)
  const [resetSelectionSignal, setResetSelectionSignal] = useState(0)
  const [workAction, setWorkAction] = useState(null)
  const [mutationPending, setMutationPending] = useState(false)
  const [colorMenuAnchor, setColorMenuAnchor] = useState(null)
  const [colorTooltipOpen, setColorTooltipOpen] = useState(false)
  const [resetTooltipOpen, setResetTooltipOpen] = useState(false)
  const [recentColors, setRecentColors] = useState(() => readRecentRowColors())
  const colorMenuAnchorRef = useRef(null)
  const recentColorsRef = useRef(recentColors)
  recentColorsRef.current = recentColors
  const detailId = detailNodeId(selectedIds)
  const paramFilters = useMemo(() => nodeIdFilters(detailId), [detailId])
  const treeStatusItems = treeFooterStatusItems(selectedIds, part, totals)
  const colorActionsEnabled = canChangeRowColor(selectedIds, closed, mutationPending)
  const closeLabel = closeActionLabel(part, closed === true)
  const closeDisabled = (closed !== true && closed !== false) || mutationPending
  const selectedRows = useMemo(
    () => (part === 'vipolnenie' ? selectedLockRows(selectedIds, lockFlags) : []),
    [part, selectedIds, lockFlags],
  )
  const lockActions = lockActionState(selectedRows, closed, mutationPending)
  const deleteMarkedEnabled = canDeleteMarkedWorks(selectedIds, closed, mutationPending)
  const deleteBlockEnabled = canDeleteBlock(
    selectedIds.length === 1 ? workAction : null,
    closed,
    mutationPending,
  )
  const selectedIdsRef = useRef(selectedIds)
  const closedRef = useRef(closed)
  const colorOverridesRef = useRef(colorOverrides)
  selectedIdsRef.current = selectedIds
  closedRef.current = closed
  colorOverridesRef.current = colorOverrides

  const closeColorTooltips = () => {
    setColorTooltipOpen(false)
    setResetTooltipOpen(false)
  }
  const setColorMenu = (anchor) => {
    colorMenuAnchorRef.current = anchor
    setColorMenuAnchor(anchor)
    closeColorTooltips()
  }

  useEffect(() => {
    setSelectedIds([])
    setLockFlags(null)
    setWorkAction(null)
    setAlgorithm('')
    setColorOverrides(new Map())
    setColorMenu(null)
  }, [treeUrl])

  useEffect(() => {
    setTotals(null)
  }, [naryadId, part])

  useEffect(() => {
    let cancelled = false
    fetchNaryadTotals(naryadId, part)
      .then((data) => {
        if (!cancelled) setTotals(data ?? null)
      })
      .catch(() => {
        if (!cancelled) setTotals(null)
      })
    return () => {
      cancelled = true
    }
  }, [naryadId, part, treeReload])

  useEffect(() => {
    if (part !== 'vipolnenie') {
      setLockFlags(null)
      return undefined
    }
    let cancelled = false
    setLockFlags(null)
    fetchNaryadWorkLocks(naryadId)
      .then((rows) => {
        if (!cancelled) setLockFlags(lockFlagMap(rows))
      })
      .catch(() => {
        if (!cancelled) setLockFlags(null)
      })
    return () => {
      cancelled = true
    }
  }, [part, naryadId, treeReload])

  useEffect(() => {
    if (detailId == null) {
      setWorkAction(null)
      return undefined
    }
    let cancelled = false
    setWorkAction(null)
    fetchNaryadWorkAction(naryadId, part, detailId)
      .then((data) => {
        if (!cancelled) setWorkAction(data ?? null)
      })
      .catch(() => {
        if (!cancelled) setWorkAction(null)
      })
    return () => {
      cancelled = true
    }
  }, [naryadId, part, detailId, treeReload])

  const reloadTree = () => setTreeReload((value) => value + 1)

  const resetTreeSelection = () => {
    setSelectedIds([])
    setWorkAction(null)
    setResetSelectionSignal((value) => value + 1)
  }

  const runMutation = async (work, { reloadOnSuccess = false, reloadOnError = false } = {}) => {
    if (mutationPendingRef.current) return
    mutationPendingRef.current = true
    setMutationPending(true)
    closeColorTooltips()
    try {
      await work()
      if (reloadOnSuccess) reloadTree()
    } catch (error) {
      void showAlert(error?.message || 'Операция не выполнена')
      if (reloadOnError) reloadTree()
    } finally {
      mutationPendingRef.current = false
      setMutationPending(false)
    }
  }

  const changeClosed = async () => {
    const closing = closed !== true
    if (closing) {
      const message = part === 'vipolnenie'
        ? 'Наряд-выполнение будет закрыто!'
        : 'Наряд-задание будет закрыто!'
      const accepted = await confirm(message, { action: 'закрытие', confirmLabel: 'Закрыть' })
      if (!accepted) return
    }
    const reload = closing && part === 'zadanie'
    await runMutation(async () => {
      const result = await setNaryadPartClosed(naryadId, part, closing)
      onClosedChange?.(result?.closed === true)
      if (closing && part === 'vipolnenie') {
        await showAlert('Изменения успешно сохранены!')
      }
    }, { reloadOnSuccess: reload, reloadOnError: reload })
  }

  const changeWorkLock = (lock) => runMutation(async () => {
    const nodeIds = [...selectedIdsRef.current]
    if (lock) await lockNaryadWorks(naryadId, nodeIds)
    else await unlockNaryadWorks(naryadId, nodeIds)
  }, { reloadOnSuccess: true, reloadOnError: true })

  const deleteMarkedWorks = async () => {
    const nodeIds = [...selectedIdsRef.current]
    if (!canDeleteMarkedWorks(nodeIds, closedRef.current, mutationPendingRef.current)) return
    if (part === 'vipolnenie' && selectionHasLockedWork(selectedLockRows(nodeIds, lockFlags))) {
      resetTreeSelection()
      await showAlert(DELETE_LOCKED_MESSAGE)
      return
    }
    const accepted = await confirm(DELETE_MARKED_CONFIRM, { action: 'удаление', confirmLabel: 'Удалить' })
    if (!accepted) return
    await runMutation(async () => {
      try {
        await deleteNaryadWorks(naryadId, part, nodeIds)
      } finally {
        resetTreeSelection()
      }
    }, { reloadOnSuccess: true, reloadOnError: true })
  }

  const deleteBlock = async () => {
    const nodeId = detailNodeId(selectedIdsRef.current)
    if (!canDeleteBlock(workAction, closedRef.current, mutationPendingRef.current) || nodeId == null) return
    const accepted = await confirm(DELETE_BLOCK_CONFIRM, { action: 'удаление', confirmLabel: 'Удалить' })
    if (!accepted) return
    await runMutation(async () => {
      await deleteNaryadBlock(naryadId, part, nodeId)
      resetTreeSelection()
    }, { reloadOnSuccess: true, reloadOnError: true })
  }

  useEffect(() => {
    if (selectedIds.length === 0 || closed === true) setColorMenu(null)
  }, [selectedIds, closed])

  useEffect(() => {
    if (colorMenuAnchor || !colorActionsEnabled) closeColorTooltips()
  }, [colorMenuAnchor, colorActionsEnabled])

  useEffect(() => {
    if (!colorMenuAnchor) return
    const stored = readRecentRowColors()
    recentColorsRef.current = stored
    setRecentColors(stored)
  }, [colorMenuAnchor])

  useEffect(() => {
    let cancelled = false
    if (detailId == null || !algorithmUrl) {
      setAlgorithm('')
      return undefined
    }
    fetchNaryadAlgorithm(algorithmUrl, detailId)
      .then((data) => {
        if (!cancelled) setAlgorithm(data?.text ?? '')
      })
      .catch(() => {
        if (!cancelled) setAlgorithm('')
      })
    return () => {
      cancelled = true
    }
  }, [algorithmUrl, detailId])

  const revertCustomPreview = () => {
    const baseline = customPreviewBaselineRef.current
    customPreviewBaselineRef.current = null
    if (!baseline) return
    setColorOverrides((current) => withoutUnsavedColorOverrides(current, baseline.baselines))
  }

  const drainColorSaves = async () => {
    if (mutationPendingRef.current) return false
    const job = desiredColorRef.current
    if (!job) return false
    if (!canChangeRowColor(job.nodeIds, closedRef.current, false)) {
      desiredColorRef.current = null
      return false
    }
    desiredColorRef.current = null
    mutationPendingRef.current = true
    setMutationPending(true)
    closeColorTooltips()
    let saved = false
    try {
      const updated = await updateNaryadRowsColor(naryadId, part, job.nodeIds, job.color)
      setColorOverrides((current) => {
        if (desiredColorRef.current) return current
        return withRowColorOverrides(current, updated.nodeIds ?? job.nodeIds, updated.color)
      })
      // Синяя подсветка скрывает фон, но набор строк остаётся целью кнопок:
      // цвет можно подбирать повторно, не выбирая их заново.
      setClearSelectionSignal((signal) => signal + 1)
      if (job.closeMenu) setColorMenu(null)
      if (!desiredColorRef.current) customPreviewBaselineRef.current = null
      saved = true
    } catch {
      if (!desiredColorRef.current) revertCustomPreview()
      void showAlert('Не удалось изменить цвет выбранных строк.')
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
    const nodeIds = [...selectedIdsRef.current]
    if (!canChangeRowColor(nodeIds, closed, false)) return Promise.resolve(false)
    if (closeMenu) customPreviewBaselineRef.current = null
    desiredColorRef.current = { color, closeMenu, nodeIds }
    return drainColorSaves()
  }

  const previewCustomColor = (css) => {
    if (ignoreCustomInputRef.current) return
    let color
    try {
      color = cssColorToDelphi(css)
    } catch {
      return
    }
    if (!customPreviewBaselineRef.current) {
      const nodeIds = [...selectedIdsRef.current]
      if (!canChangeRowColor(nodeIds, closedRef.current, false)) return
      customPreviewBaselineRef.current = {
        baselines: colorOverrideBaselines(colorOverridesRef.current, nodeIds),
        nodeIds,
      }
    }
    const nodeIds = customPreviewBaselineRef.current.nodeIds
    setColorOverrides((current) => withRowColorOverrides(current, nodeIds, color))
    setClearSelectionSignal((signal) => signal + 1)
    desiredColorRef.current = { color, closeMenu: false, nodeIds: [...nodeIds] }
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
      const nextRecent = rememberRecentRowColor(recentColorsRef.current, css)
      if (nextRecent !== recentColorsRef.current) {
        recentColorsRef.current = nextRecent
        writeRecentRowColors(nextRecent)
        setRecentColors(nextRecent)
      }
      const preview = customPreviewBaselineRef.current
      const nodeIds = preview?.nodeIds ? [...preview.nodeIds] : [...selectedIdsRef.current]
      if (!canChangeRowColor(nodeIds, closedRef.current, false)) return
      desiredColorRef.current = {
        color,
        closeMenu: true,
        nodeIds,
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
      <WorkspaceActionBar ariaLabel={actionBarAriaLabel}>
        <ActionButton
          label="Удалить помеченные работы"
          icon={DeleteOutline}
          disabled={!deleteMarkedEnabled}
          onClick={() => {
            void deleteMarkedWorks()
          }}
        />
        <ActionButton
          label="Удаление блока без удаления входящих работ"
          icon={FolderDelete}
          disabled={!deleteBlockEnabled}
          onClick={() => {
            void deleteBlock()
          }}
        />
        <ActionButton
          label={closeLabel}
          icon={closed === true ? Lock : LockOpen}
          disabled={closeDisabled}
          onClick={() => {
            void changeClosed()
          }}
        />
        {part === 'vipolnenie' ? (
          <>
            <ActionButton
              label="Блокировать текущую работу"
              icon={LinkIcon}
              disabled={!lockActions.canLock}
              onClick={() => {
                void changeWorkLock(true)
              }}
            />
            <ActionButton
              label="Разблокировать работу"
              icon={LinkOffIcon}
              disabled={!lockActions.canUnlock}
              onClick={() => {
                void changeWorkLock(false)
              }}
            />
          </>
        ) : null}
        <Tooltip
          title="Выделить строку цветом"
          open={colorTooltipOpen}
          disableFocusListener
          disableHoverListener
          disableTouchListener
          disableInteractive
          TransitionProps={{ timeout: 0 }}
        >
          <Box
            component="span"
            onMouseEnter={() => {
              if (colorMenuAnchorRef.current || mutationPendingRef.current) return
              setColorTooltipOpen(true)
            }}
            onMouseLeave={() => setColorTooltipOpen(false)}
            sx={{ display: 'inline-flex', position: 'relative' }}
          >
            <IconButton
              aria-label="Выделить строку цветом"
              aria-haspopup="dialog"
              aria-expanded={Boolean(colorMenuAnchor)}
              disabled={!colorActionsEnabled}
              onClick={(event) => {
                event.currentTarget.blur()
                setColorMenu(event.currentTarget)
              }}
              sx={actionButtonSx}
            >
              <Colorize />
            </IconButton>
            <Popover
              open={Boolean(colorMenuAnchor)}
              anchorEl={colorMenuAnchor}
              onClose={() => setColorMenu(null)}
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
                      setColorMenu(null)
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
                {Array.from({ length: NARYAD_RECENT_ROW_COLOR_LIMIT }, (_, index) => {
                  const css = recentColors[index]
                  if (!css) {
                    return (
                      <Box
                        key={`empty-recent-${index}`}
                        aria-hidden
                        sx={{
                          width: 28,
                          height: 28,
                          borderRadius: 0.5,
                          border: 1,
                          borderColor: 'divider',
                        }}
                      />
                    )
                  }
                  return (
                    <Box
                      key={css}
                      component="button"
                      type="button"
                      aria-label={`Недавний цвет ${css}`}
                      onClick={() => {
                        setColorMenu(null)
                        void changeSelectedRowColor(cssColorToDelphi(css))
                      }}
                      sx={{
                        width: 28,
                        height: 28,
                        p: 0,
                        borderRadius: 0.5,
                        border: 1,
                        borderColor: 'divider',
                        bgcolor: css,
                        cursor: 'pointer',
                      }}
                    />
                  )
                })}
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
          open={resetTooltipOpen}
          disableFocusListener
          disableHoverListener
          disableTouchListener
          disableInteractive
          TransitionProps={{ timeout: 0 }}
        >
          <Box
            component="span"
            onMouseEnter={() => {
              if (mutationPendingRef.current) return
              setResetTooltipOpen(true)
            }}
            onMouseLeave={() => setResetTooltipOpen(false)}
            sx={{ display: 'inline-flex' }}
          >
            <IconButton
              aria-label="Сбросить цвет"
              disabled={!colorActionsEnabled}
              onClick={(event) => {
                event.currentTarget.blur()
                closeColorTooltips()
                void changeSelectedRowColor(0)
              }}
              sx={actionButtonSx}
            >
              <FormatColorReset />
            </IconButton>
          </Box>
        </Tooltip>
      </WorkspaceActionBar>

      <Box
        ref={rightPanel.containerRef}
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
                multiSelect
                setSelectedIds={setSelectedIds}
                reRenderSignal={treeReload}
                getRowBackgroundColor={(row) => rowBackgroundColor(row, colorOverrides)}
                clearSelectionSignal={clearSelectionSignal}
                resetSelectionSignal={resetSelectionSignal}
                initialState={{ pagination: { pageIndex: 0, pageSize: 10000 } }}
              />
            </Box>
            <TreeStatusBar items={treeStatusItems} />
          </Box>

          <PanelSplitter
            ariaLabel="Ширина панели параметров"
            dragging={rightPanel.dragging}
            onPointerDown={rightPanel.onSplitterPointerDown}
          />

          <Box
            sx={{
              width: rightPanel.width ?? `${RIGHT_PANEL_DEFAULT_RATIO * 100}%`,
              flexShrink: 0,
              minWidth: 0,
              minHeight: 0,
              display: 'flex',
              flexDirection: 'column',
              overflow: 'hidden',
            }}
          >
            <WorkDetailsPanel
              paramsUrl={paramsUrl}
              paramColumns={paramColumns}
              paramFilters={paramFilters}
              algorithm={algorithm}
            />
          </Box>
        </AxiosProvider>
      </Box>
    </Box>
  )
}
