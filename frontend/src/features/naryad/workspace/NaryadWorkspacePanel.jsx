import { useEffect, useMemo, useState } from 'react'
import Box from '@mui/material/Box'
import FolderDelete from '@mui/icons-material/FolderDelete'
import DeleteOutline from '@mui/icons-material/DeleteOutline'
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
} from '../../../api/naryadyApi.js'
import { useAlert, useConfirm } from '../../../context/ConfirmContext.jsx'
import ActionButton from './ActionButton.jsx'
import TreeStatusBar from './TreeStatusBar.jsx'
import WorkDetailsPanel from './WorkDetailsPanel.jsx'
import WorkspaceActionBar from './WorkspaceActionBar.jsx'
import PanelSplitter from './layout/PanelSplitter.jsx'
import useColumnSizingPersistence from './layout/useColumnSizingPersistence.js'
import useResizablePanel from './layout/useResizablePanel.js'
import useLatest from './useLatest.js'
import useMutationRunner from './useMutationRunner.js'
import useWorkTree from './useWorkTree.js'
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
import RowColorActions from '../actions/color/RowColorActions.jsx'
import useRowColorEditing from '../actions/color/useRowColorEditing.js'

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
  useColumnSizingPersistence([
    [treeUrl, treeSizingKey],
    [paramsUrl, paramsSizingKey],
  ])
  const rightPanel = useResizablePanel(rightPanelStorageKey)
  const tree = useWorkTree(treeUrl)
  const mutation = useMutationRunner(showAlert)
  const getClosed = useLatest(closed)
  const colors = useRowColorEditing({
    naryadId,
    part,
    resetKey: treeUrl,
    tree,
    closed,
    mutation,
    showAlert,
  })

  const { selectedIds, detailId, reloadSignal } = tree
  const [lockFlags, setLockFlags] = useState(null)
  const [totals, setTotals] = useState(null)
  const [algorithm, setAlgorithm] = useState('')
  const [workAction, setWorkAction] = useState(null)
  const paramFilters = useMemo(() => nodeIdFilters(detailId), [detailId])
  const treeStatusItems = treeFooterStatusItems(selectedIds, part, totals)
  const closeLabel = closeActionLabel(part, closed === true)
  const closeDisabled = (closed !== true && closed !== false) || mutation.pending
  const selectedRows = useMemo(
    () => (part === 'vipolnenie' ? selectedLockRows(selectedIds, lockFlags) : []),
    [part, selectedIds, lockFlags],
  )
  const lockActions = lockActionState(selectedRows, closed, mutation.pending)
  const deleteMarkedEnabled = canDeleteMarkedWorks(selectedIds, closed, mutation.pending)
  const deleteBlockEnabled = canDeleteBlock(
    selectedIds.length === 1 ? workAction : null,
    closed,
    mutation.pending,
  )

  useEffect(() => {
    setLockFlags(null)
    setWorkAction(null)
    setAlgorithm('')
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
  }, [naryadId, part, reloadSignal])

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
  }, [part, naryadId, reloadSignal])

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
  }, [naryadId, part, detailId, reloadSignal])

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

  const runMutation = (work, { reload = false } = {}) => (
    mutation.run(work, { onDone: reload ? tree.reload : undefined })
  )

  const changeClosed = async () => {
    const closing = closed !== true
    if (closing) {
      const message = part === 'vipolnenie'
        ? 'Наряд-выполнение будет закрыто!'
        : 'Наряд-задание будет закрыто!'
      const accepted = await confirm(message, { action: 'закрытие', confirmLabel: 'Закрыть' })
      if (!accepted) return
    }
    await runMutation(async () => {
      const result = await setNaryadPartClosed(naryadId, part, closing)
      onClosedChange?.(result?.closed === true)
      if (closing && part === 'vipolnenie') {
        await showAlert('Изменения успешно сохранены!')
      }
    }, { reload: closing && part === 'zadanie' })
  }

  const changeWorkLock = (lock) => runMutation(async () => {
    const nodeIds = [...tree.getSelectedIds()]
    if (lock) await lockNaryadWorks(naryadId, nodeIds)
    else await unlockNaryadWorks(naryadId, nodeIds)
  }, { reload: true })

  const deleteMarkedWorks = async () => {
    const nodeIds = [...tree.getSelectedIds()]
    if (!canDeleteMarkedWorks(nodeIds, getClosed(), mutation.isPending())) return
    if (part === 'vipolnenie' && selectionHasLockedWork(selectedLockRows(nodeIds, lockFlags))) {
      tree.resetSelection()
      await showAlert(DELETE_LOCKED_MESSAGE)
      return
    }
    const accepted = await confirm(DELETE_MARKED_CONFIRM, { action: 'удаление', confirmLabel: 'Удалить' })
    if (!accepted) return
    await runMutation(async () => {
      try {
        await deleteNaryadWorks(naryadId, part, nodeIds)
      } finally {
        tree.resetSelection()
      }
    }, { reload: true })
  }

  const deleteBlock = async () => {
    const nodeId = detailNodeId(tree.getSelectedIds())
    if (!canDeleteBlock(workAction, getClosed(), mutation.isPending()) || nodeId == null) return
    const accepted = await confirm(DELETE_BLOCK_CONFIRM, { action: 'удаление', confirmLabel: 'Удалить' })
    if (!accepted) return
    await runMutation(async () => {
      await deleteNaryadBlock(naryadId, part, nodeId)
      tree.resetSelection()
    }, { reload: true })
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
        <RowColorActions colors={colors} isPending={mutation.isPending} />
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
                multiSelect
                {...tree.tableProps}
                getRowBackgroundColor={colors.getRowBackgroundColor}
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
