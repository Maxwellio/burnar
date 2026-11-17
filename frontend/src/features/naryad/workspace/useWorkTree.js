import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
  applyCatalogFilterChange,
  buildCatalogTableFilters,
} from '../../../pages/catalogTreeFilters.js'
import { detailNodeId } from './naryadWorkspaceData.js'
import useLatest from './useLatest.js'

/**
 * Состояние дерева работ одной вкладки и команды для BaseTreeTable.
 * Пакет понимает только счётчики-сигналы, поэтому снаружи они спрятаны за методами.
 * «Раскрыть все» кладёт expandAll в фильтры, как окно каталога.
 * «Свернуть все» сбрасывает раскрытие и снимает expandAll, чтобы следующее
 * обновление дерева не раскрывало его снова.
 */
export default function useWorkTree(treeUrl) {
  const [filters, setFilters] = useState([])
  const [expandToken, setExpandToken] = useState(null)
  const [filterEpoch, setFilterEpoch] = useState(0)
  const [selectedIds, setSelectedIds] = useState([])
  const [reloadSignal, setReloadSignal] = useState(0)
  const [clearSignal, setClearSignal] = useState(0)
  const [resetSignal, setResetSignal] = useState(0)
  const filtersRef = useRef(filters)
  const expandTokenRef = useRef(expandToken)
  const getSelectedIds = useLatest(selectedIds)
  filtersRef.current = filters
  expandTokenRef.current = expandToken

  useEffect(() => {
    setSelectedIds([])
    setFilters([])
    setExpandToken(null)
    setFilterEpoch(0)
  }, [treeUrl])

  const tableFilters = useMemo(
    () => buildCatalogTableFilters(filters, expandToken),
    [filters, expandToken, filterEpoch],
  )

  const handleSetFilters = useCallback((updater) => {
    const result = applyCatalogFilterChange({
      prevFilters: filtersRef.current,
      expandToken: expandTokenRef.current,
      updater,
    })
    setExpandToken(result.expandToken)
    setFilters(result.filters)
  }, [])

  /** Перечитать дерево с корней; раскрытые узлы пакет догружает сам. */
  const reload = useCallback(() => setReloadSignal((value) => value + 1), [])

  /** Погасить синюю подсветку, оставив набор строк целью кнопок. */
  const clearHighlight = useCallback(() => setClearSignal((value) => value + 1), [])

  /** Снять и подсветку, и набор. */
  const resetSelection = useCallback(() => {
    setSelectedIds([])
    setResetSignal((value) => value + 1)
  }, [])

  const expandAll = useCallback(() => {
    setExpandToken((token) => (token ?? 0) + 1)
  }, [])

  const collapseAll = useCallback(() => {
    setExpandToken(null)
    setFilterEpoch((epoch) => epoch + 1)
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
      filters: tableFilters,
      setFilters: handleSetFilters,
      setSelectedIds,
      reRenderSignal: reloadSignal,
      clearSelectionSignal: clearSignal,
      resetSelectionSignal: resetSignal,
    },
  }
}
