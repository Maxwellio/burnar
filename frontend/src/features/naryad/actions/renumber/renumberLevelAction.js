import FormatListNumbered from '@mui/icons-material/FormatListNumbered'
import { renumberNaryadLevel } from '../../../../api/naryadyApi.js'
import { detailNodeId } from '../../workspace/naryadWorkspaceData.js'
import { RENUMBER_LABEL, canRenumber } from './renumberRules.js'

/** Delphi actReOrderRab. Подтверждения нет: процедура только уплотняет номера соседей. */
export const renumberLevelAction = {
  id: 'renumber-level',
  label: RENUMBER_LABEL,
  icon: FormatListNumbered,
  isEnabled: (ctx) => canRenumber(ctx.tree.selectedIds, ctx.closed, ctx.mutation.pending),
  async run(ctx) {
    const nodeId = detailNodeId(ctx.tree.getSelectedIds())
    if (nodeId == null || !canRenumber([nodeId], ctx.getClosed(), ctx.mutation.isPending())) return
    await ctx.runMutation(async () => {
      await renumberNaryadLevel(ctx.naryadId, ctx.part.id, nodeId)
    }, { reload: true })
  },
}
