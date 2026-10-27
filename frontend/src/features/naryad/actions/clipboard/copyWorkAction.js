import ContentCopy from '@mui/icons-material/ContentCopy'
import {
  canCopyOrCut,
  nestedSelectionWarning,
  visualOrder,
} from './clipboardRules.js'

/** Delphi actCopyRab: снимок выбранных строк, новое копирование заменяет буфер. */
export const copyWorkAction = {
  id: 'copy-works',
  label: 'Копировать блок',
  icon: ContentCopy,
  warning: (ctx) => nestedSelectionWarning(ctx.tree.selectedIds, ctx.structureById),
  isEnabled: (ctx) => canCopyOrCut(
    ctx.tree.selectedIds,
    ctx.closed,
    ctx.mutation.pending,
    ctx.structureById,
    Boolean(nestedSelectionWarning(ctx.tree.selectedIds, ctx.structureById)),
  ),
  run(ctx) {
    const ids = ctx.tree.getSelectedIds()
    const structure = ctx.getStructure()
    const mixes = Boolean(nestedSelectionWarning(ids, structure))
    if (!canCopyOrCut(ids, ctx.getClosed(), ctx.mutation.isPending(), structure, mixes)) return
    ctx.setClipboard({ mode: 'copy', nodeIds: visualOrder(ids, structure) })
  },
}
