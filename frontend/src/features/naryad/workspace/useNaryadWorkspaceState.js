import { useEffect, useMemo, useRef } from 'react'
import { useAlert, useConfirm } from '../../../context/ConfirmContext.jsx'
import useRowColorEditing from '../actions/color/useRowColorEditing.js'
import useLatest from './useLatest.js'
import useMutationRunner from './useMutationRunner.js'
import useWorkTree from './useWorkTree.js'
import { useAlgorithm, useLockFlags, useTotals, useWorkAction } from './useWorkspaceData.js'

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
 * @param {boolean} [args.replaceZadanieAllowed]
 * @param {(header: object) => void} [args.onZadanieReplaced]
 * @param {number} [args.externalReloadSignal] страница просит перечитать дерево
 */
export default function useNaryadWorkspaceState({
  naryadId,
  part,
  closed,
  onClosedChange,
  hasVipolnenie = false,
  onVipolnenieCreated,
  replaceZadanieAllowed = false,
  onZadanieReplaced,
  externalReloadSignal = 0,
}) {
  const showAlert = useAlert()
  const confirm = useConfirm()
  const urls = useMemo(() => part.urls(naryadId), [part, naryadId])
  const tree = useWorkTree(urls.tree)
  const mutation = useMutationRunner(showAlert)
  const getClosed = useLatest(closed)
  const getHasVipolnenie = useLatest(hasVipolnenie === true)
  const getReplaceZadanieAllowed = useLatest(replaceZadanieAllowed === true)
  const { detailId, reloadSignal } = tree

  const totals = useTotals(naryadId, part.id, reloadSignal)
  const lockFlags = useLockFlags(naryadId, part.features.locks, reloadSignal)
  const workAction = useWorkAction(naryadId, part.id, detailId, reloadSignal)
  const algorithm = useAlgorithm(urls.algorithm, detailId)
  const getLockFlags = useLatest(lockFlags)
  const getTotals = useLatest(totals)
  const seenReload = useRef(externalReloadSignal)

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
    replaceZadanieAllowed: replaceZadanieAllowed === true,
    getReplaceZadanieAllowed,
    onZadanieReplaced,
    getLockFlags,
    getTotals,
    tree,
    mutation,
    runMutation,
    confirm,
    showAlert,
    totals,
    lockFlags,
    workAction,
    algorithm,
    colors,
  }
}
