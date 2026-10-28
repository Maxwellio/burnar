import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useAlert, useChoose, useConfirm, usePrompt } from '../../../context/ConfirmContext.jsx'
import { mergeWorkPatches } from '../actions/calc/workPatches.js'
import { indexStructure } from '../actions/clipboard/clipboardRules.js'
import useRowColorEditing from '../actions/color/useRowColorEditing.js'
import useLatest from './useLatest.js'
import useMutationRunner from './useMutationRunner.js'
import useWorkTree from './useWorkTree.js'
import { useAlgorithm, useLockFlags, useStructure, useTotals, useWorkAction } from './useWorkspaceData.js'

/**
 * Собирает всё, что нужно кнопкам и панелям вкладки. Результат кладётся
 * в NaryadWorkspaceProvider и читается через useNaryadWorkspace.
 *
 * Обработчики, которые продолжают работу после await, берут выбор и флаг
 * закрытия через tree.getSelectedIds() / getClosed(), а не из замыкания.
 *
 * @param {object} args
 * @param {number|string} args.naryadId
 * @param {object} args.part описание части из parts/
 * @param {boolean|null} args.closed null, пока заголовок карточки не загружен
 * @param {(closed: boolean) => void} [args.onClosedChange]
 * @param {boolean} [args.hasVipolnenie]
 * @param {(header: object) => void} [args.onVipolnenieCreated]
 * @param {(header: object) => void} [args.onZadanieReplaced]
 * @param {number} [args.externalReloadSignal] страница просит перечитать дерево
 * @param {(partId: string) => void} [args.onOpenSkv] открыть окно сквозных параметров
 */
export default function useNaryadWorkspaceState({
  naryadId,
  part,
  closed,
  onClosedChange,
  hasVipolnenie = false,
  onVipolnenieCreated,
  onZadanieReplaced,
  externalReloadSignal = 0,
  onOpenSkv,
}) {
  const showAlert = useAlert()
  const confirm = useConfirm()
  const choose = useChoose()
  const prompt = usePrompt()
  const urls = useMemo(() => part.urls(naryadId), [part, naryadId])
  const tree = useWorkTree(urls.tree)
  const mutation = useMutationRunner(showAlert)
  const getClosed = useLatest(closed)
  const getHasVipolnenie = useLatest(hasVipolnenie === true)
  const { detailId, reloadSignal } = tree

  const [totalsEpoch, setTotalsEpoch] = useState(0)
  const [paramsReloadSignal, setParamsReloadSignal] = useState(0)
  const [workPatches, setWorkPatches] = useState(() => new Map())
  const refreshTotals = useCallback(() => setTotalsEpoch((value) => value + 1), [])
  const reloadParams = useCallback(() => setParamsReloadSignal((value) => value + 1), [])
  const applyWorkPatches = useCallback((patches) => {
    setWorkPatches((current) => mergeWorkPatches(current, patches))
  }, [])
  const saveQueue = useRef(Promise.resolve())
  const paramsSeen = useRef(false)
  const totals = useTotals(naryadId, part.id, reloadSignal, totalsEpoch)
  const lockFlags = useLockFlags(naryadId, part.features.locks, reloadSignal)
  const structureRows = useStructure(naryadId, part.id, reloadSignal)
  const structureById = useMemo(
    () => (Array.isArray(structureRows) ? indexStructure(structureRows) : null),
    [structureRows],
  )
  const getStructure = useLatest(structureById)
  const [clipboard, setClipboardState] = useState(null)
  const clipboardRef = useRef(null)
  const setClipboard = useCallback((value) => {
    clipboardRef.current = value
    setClipboardState(value)
  }, [])
  const getClipboard = useCallback(() => clipboardRef.current, [])
  const clearClipboard = useCallback(() => {
    clipboardRef.current = null
    setClipboardState(null)
  }, [])
  const workAction = useWorkAction(naryadId, part.id, detailId, reloadSignal)
  const algorithm = useAlgorithm(urls.algorithm, detailId, reloadSignal)
  const getLockFlags = useLatest(lockFlags)
  const getTotals = useLatest(totals)
  const seenReload = useRef(externalReloadSignal)

  useEffect(() => {
    setWorkPatches(new Map())
  }, [reloadSignal])

  useEffect(() => {
    clipboardRef.current = null
    setClipboardState(null)
  }, [urls.tree])

  useEffect(() => {
    if (!paramsSeen.current) {
      paramsSeen.current = true
      return
    }
    setParamsReloadSignal((value) => value + 1)
  }, [reloadSignal, closed])

  const enqueueSave = (work) => {
    const job = saveQueue.current.then(async () => {
      while (mutation.isPending()) {
        await new Promise((resolve) => setTimeout(resolve, 20))
      }
      return work()
    })
    saveQueue.current = job.then(() => undefined, () => undefined)
    return job
  }

  useEffect(() => {
    if (seenReload.current === externalReloadSignal) return
    const previous = seenReload.current
    seenReload.current = externalReloadSignal
    if (externalReloadSignal > previous) tree.reload()
  }, [externalReloadSignal, tree.reload])
  const colors = useRowColorEditing({
    naryadId,
    part: part.id,
    resetKey: urls.tree,
    tree,
    closed,
    mutation,
    showAlert,
  })

  /** Изменение под общей блокировкой; reload перечитывает дерево и после успеха, и после отказа. */
  const runMutation = (work, { reload = false } = {}) => (
    mutation.run(work, { onDone: reload ? tree.reload : undefined })
  )

  return {
    naryadId,
    part,
    urls,
    closed,
    getClosed,
    onClosedChange,
    hasVipolnenie: hasVipolnenie === true,
    getHasVipolnenie,
    onVipolnenieCreated,
    onZadanieReplaced,
    openSkv: onOpenSkv ? () => onOpenSkv(part.id) : undefined,
    getLockFlags,
    getTotals,
    tree,
    mutation,
    runMutation,
    confirm,
    choose,
    prompt,
    showAlert,
    clipboard,
    setClipboard,
    getClipboard,
    clearClipboard,
    structureById,
    getStructure,
    totals,
    lockFlags,
    workAction,
    algorithm,
    colors,
    workValues: { overrides: workPatches, apply: applyWorkPatches },
    refreshTotals,
    reloadParams,
    paramsReloadSignal,
    enqueueSave,
  }
}
