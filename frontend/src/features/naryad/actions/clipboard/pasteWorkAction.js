import ContentPaste from '@mui/icons-material/ContentPaste'
import { pasteNaryadClipboard } from '../../../../api/naryadyApi.js'
import { detailNodeId } from '../../workspace/naryadWorkspaceData.js'
import { canPaste, emptyBlockPasteMessage, isEmptyBlock } from './clipboardRules.js'

/** Delphi actPasteRab. Отмена вопроса «внутрь / перед» вставку не начинает. */
export const pasteWorkAction = {
  id: 'paste-works',
  label: 'Вставить блок',
  icon: ContentPaste,
  isEnabled: (ctx) => {
    const targetId = detailNodeId(ctx.tree.selectedIds)
    const target = targetId == null ? null : ctx.structureById?.get(Number(targetId))
    return canPaste(ctx.clipboard, target, ctx.closed, ctx.mutation.pending)
  },
  async run(ctx) {
    const clipboard = ctx.getClipboard()
    const targetId = detailNodeId(ctx.tree.getSelectedIds())
    const target = targetId == null ? null : ctx.getStructure()?.get(Number(targetId))
    if (!canPaste(clipboard, target, ctx.getClosed(), ctx.mutation.isPending())) return
    let place = 'before'
    if (isEmptyBlock(target)) {
      const choice = await ctx.choose(emptyBlockPasteMessage(clipboard.mode), {
        title: 'Внимание',
        confirmLabel: 'Внутрь блока',
        confirmResult: 'inside',
        alternateLabel: 'Перед блоком',
        alternateResult: 'before',
        cancelLabel: 'Отмена',
      })
      if (choice == null) return
      place = choice
    }
    await ctx.runMutation(async () => {
      try {
        await pasteNaryadClipboard(ctx.naryadId, ctx.part.id, {
          mode: clipboard.mode,
          nodeIds: clipboard.nodeIds,
          targetId: Number(targetId),
          place,
        })
      } finally {
        ctx.clearClipboard()
      }
    }, { reload: true })
  },
}
