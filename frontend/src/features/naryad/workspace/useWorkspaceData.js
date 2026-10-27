import {
  fetchNaryadAlgorithm,
  fetchNaryadStructure,
  fetchNaryadTotals,
  fetchNaryadWorkAction,
  fetchNaryadWorkLocks,
} from '../../../api/naryadyApi.js'
import { lockFlagMap } from '../actions/lock/lockRules.js'
import useAsyncValue from './useAsyncValue.js'

/** Итоги CalcItogsNS всего дерева; на время перечитывания остаются прежние числа. */
export function useTotals(naryadId, part, reloadSignal, refreshSignal = 0) {
  return useAsyncValue(
    () => fetchNaryadTotals(naryadId, part),
    [naryadId, part, reloadSignal, refreshSignal],
    { clearOnRefetch: false, resetKey: `${naryadId}:${part}` },
  )
}

/** id → locked всех работ выполнения. Один запрос на загрузку дерева, не на каждый выбор. */
export function useLockFlags(naryadId, enabled, reloadSignal) {
  return useAsyncValue(
    async () => lockFlagMap(await fetchNaryadWorkLocks(naryadId)),
    [naryadId, reloadSignal],
    { enabled },
  )
}

/** Все строки части: родитель и тип, чтобы не копировать блок вместе с работой внутри. */
export function useStructure(naryadId, part, reloadSignal) {
  return useAsyncValue(
    () => fetchNaryadStructure(naryadId, part),
    [naryadId, part, reloadSignal],
  )
}

/** Поля единственной выбранной строки, от которых зависят кнопки (тип, блокировка, RS). */
export function useWorkAction(naryadId, part, nodeId, reloadSignal) {
  return useAsyncValue(
    () => fetchNaryadWorkAction(naryadId, part, nodeId),
    [naryadId, part, nodeId, reloadSignal],
    { enabled: nodeId != null },
  )
}

/** Текст алгоритма единственной выбранной строки (algs.ops, только тип 80). */
export function useAlgorithm(algorithmUrl, nodeId, reloadSignal = 0) {
  return useAsyncValue(
    async () => (await fetchNaryadAlgorithm(algorithmUrl, nodeId))?.text ?? '',
    [algorithmUrl, nodeId, reloadSignal],
    { enabled: nodeId != null && Boolean(algorithmUrl), empty: '', clearOnRefetch: false },
  )
}
