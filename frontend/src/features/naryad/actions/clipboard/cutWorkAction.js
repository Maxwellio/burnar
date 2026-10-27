import ContentCut from '@mui/icons-material/ContentCut'
import { selectedLockRows } from '../lock/lockRules.js'
import { selectionHasLockedWork } from '../delete/deleteRules.js'
import {
  CUT_LOCKED_MESSAGE,
  canCopyOrCut,
  nestedSelectionWarning,
  visualOrder,
} from './clipboardRules.js'

/**
 * Delphi actCutRab. В выполнении заблокированная строка в наборе снимает
 * выделение и не попадает в буфер. Новое вырезание заменяет прежний снимок.
 */
export const cutWorkAction = {
  id: 'cut-works',
  label: 'Вырезать блок',
  icon: ContentCut,
  warning: (ctx) => nestedSelectionWarning(ctx.tree.selectedIds, ctx.structureById),
  isEnabled: (ctx) => canCopyOrCut(
    ctx.tree.selectedIds,
    ctx.closed,
    ctx.mutation.pending,
    ctx.structureById,
    Boolean(nestedSelectionWarning(ctx.tree.selectedIds, ctx.structureById)),
  ),
  async run(ctx) {
    const ids = ctx.tree.getSelectedIds()
    const structure = ctx.getStructure()
    const mixes = Boolean(nestedSelectionWarning(ids, structure))
    if (!canCopyOrCut(ids, ctx.getClosed(), ctx.mutation.isPending(), structure, mixes)) return
    if (ctx.part.features.locks && selectionHasLockedWork(selectedLockRows(ids, ctx.getLockFlags()))) {
      ctx.tree.resetSelection()
      await ctx.showAlert(CUT_LOCKED_MESSAGE)
      return
    }
    ctx.setClipboard({ mode: 'cut', nodeIds: visualOrder(ids, structure) })
  },
}
