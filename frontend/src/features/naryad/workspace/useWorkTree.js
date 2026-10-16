import { useCallback, useEffect, useState } from 'react'
import { detailNodeId } from './naryadWorkspaceData.js'
import useLatest from './useLatest.js'

/**
 * Состояние дерева работ одной вкладки и команды для BaseTreeTable.
 * Пакет понимает только счётчики-сигналы, поэтому снаружи они спрятаны за методами.
 */
export default function useWorkTree(treeUrl) {
  const [filters, setFilters] = useState([])
  const [selectedIds, setSelectedIds] = useState([])
  const [reloadSignal, setReloadSignal] = useState(0)
  const [clearSignal, setClearSignal] = useState(0)
  const [resetSignal, setResetSignal] = useState(0)
  const getSelectedIds = useLatest(selectedIds)

  useEffect(() => {
    setSelectedIds([])
  }, [treeUrl])

  /** Перечитать дерево с корней; раскрытые узлы пакет догружает сам. */
  const reload = useCallback(() => setReloadSignal((value) => value + 1), [])

  /** Погасить синюю подсветку, оставив набор строк целью кнопок. */
  const clearHighlight = useCallback(() => setClearSignal((value) => value + 1), [])

  /** Снять и подсветку, и набор. */
  const resetSelection = useCallback(() => {
    setSelectedIds([])
    setResetSignal((value) => value + 1)
  }, [])

  return {
    selectedIds,
    getSelectedIds,
    detailId: detailNodeId(selectedIds),
    reloadSignal,
    reload,
    clearHighlight,
    resetSelection,
    tableProps: {
      filters,
      setFilters,
      setSelectedIds,
      reRenderSignal: reloadSignal,
      clearSelectionSignal: clearSignal,
      resetSelectionSignal: resetSignal,
    },
  }
}
