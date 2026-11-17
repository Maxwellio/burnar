import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { detailNodeId } from './naryadWorkspaceData.js'
import useLatest from './useLatest.js'
import {
  buildTreeExpandFilters,
  expandTokenAfterTableFilters,
  nextExpandToken,
} from './treeExpandFilters.js'

/**
 * Состояние дерева работ одной вкладки и команды для BaseTreeTable.
 * Пакет понимает только счётчики-сигналы, поэтому снаружи они спрятаны за методами.
 */
export default function useWorkTree(treeUrl) {
  const [expandToken, setExpandToken] = useState(null)
  const [collapseEpoch, setCollapseEpoch] = useState(0)
  const [selectedIds, setSelectedIds] = useState([])
  const [reloadSignal, setReloadSignal] = useState(0)
  const [clearSignal, setClearSignal] = useState(0)
  const [resetSignal, setResetSignal] = useState(0)
  const expandTokenRef = useRef(expandToken)
  const urlRef = useRef(treeUrl)
  expandTokenRef.current = expandToken
  const getSelectedIds = useLatest(selectedIds)

  if (urlRef.current !== treeUrl) {
    urlRef.current = treeUrl
    setExpandToken(null)
    setCollapseEpoch(0)
  }

  const filters = useMemo(
    () => buildTreeExpandFilters(expandToken),
    [expandToken, collapseEpoch],
  )

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

  /** Полный лес. Новый токен заставляет пакет перечитать корни. */
  const expandAll = useCallback(() => {
    setExpandToken((token) => nextExpandToken(token))
  }, [])

  /**
   * Свернуть до корней. Эпоха меняет ссылку фильтров даже без expandAll,
   * иначе пакет не сбрасывает уже раскрытые узлы.
   */
  const collapseAll = useCallback(() => {
    setExpandToken(null)
    setCollapseEpoch((epoch) => epoch + 1)
  }, [])

  const setFilters = useCallback((updater) => {
    const next = expandTokenAfterTableFilters(expandTokenRef.current, updater)
    if (next != null || expandTokenRef.current == null) return
    setExpandToken(null)
    setCollapseEpoch((epoch) => epoch + 1)
  }, [])

  return {
    selectedIds,
    getSelectedIds,
    detailId: detailNodeId(selectedIds),
    reloadSignal,
    reload,
    clearHighlight,
    resetSelection,
    expandAll,
    collapseAll,
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
