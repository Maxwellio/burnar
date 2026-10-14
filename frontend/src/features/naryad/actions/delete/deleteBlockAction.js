import FolderDelete from '@mui/icons-material/FolderDelete'
import { deleteNaryadBlock } from '../../../../api/naryadyApi.js'
import { detailNodeId } from '../../workspace/naryadWorkspaceData.js'
import { DELETE_BLOCK_CONFIRM, canDeleteBlock } from './deleteRules.js'

/** Delphi act*_del_block: блок уходит, вложенные работы поднимаются на его уровень. */
export const deleteBlockAction = {
  id: 'delete-block',
  label: 'Удаление блока без удаления входящих работ',
  icon: FolderDelete,
  isEnabled: (ctx) => canDeleteBlock(
    ctx.tree.selectedIds.length === 1 ? ctx.workAction : null,
    ctx.closed,
    ctx.mutation.pending,
  ),
  async run(ctx) {
    const { tree, part, naryadId } = ctx
    const nodeId = detailNodeId(tree.getSelectedIds())
    if (nodeId == null) return
    if (!canDeleteBlock(ctx.workAction, ctx.getClosed(), ctx.mutation.isPending())) return
    const accepted = await ctx.confirm(DELETE_BLOCK_CONFIRM, {
      action: 'удаление',
      confirmLabel: 'Удалить',
    })
    if (!accepted) return
    await ctx.runMutation(async () => {
      await deleteNaryadBlock(naryadId, part.id, nodeId)
      tree.resetSelection()
    }, { reload: true })
  },
}
