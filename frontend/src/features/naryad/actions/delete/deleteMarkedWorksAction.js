import DeleteOutline from '@mui/icons-material/DeleteOutline'
import { deleteNaryadWorks } from '../../../../api/naryadyApi.js'
import { selectedLockRows } from '../lock/lockRules.js'
import {
  DELETE_LOCKED_MESSAGE,
  DELETE_MARKED_CONFIRM,
  canDeleteMarkedWorks,
  selectionHasLockedWork,
} from './deleteRules.js'

/**
 * Delphi actDelSelOpers: выбранные работы вместе с вложенными.
 * Где работы блокируются, набор с заблокированной строкой не удаляется целиком.
 */
export const deleteMarkedWorksAction = {
  id: 'delete-marked-works',
  label: 'Удалить помеченные работы',
  icon: DeleteOutline,
  isEnabled: (ctx) => canDeleteMarkedWorks(ctx.tree.selectedIds, ctx.closed, ctx.mutation.pending),
  async run(ctx) {
    const { tree, part, naryadId } = ctx
    const nodeIds = [...tree.getSelectedIds()]
    if (!canDeleteMarkedWorks(nodeIds, ctx.getClosed(), ctx.mutation.isPending())) return
    if (part.features.locks && selectionHasLockedWork(selectedLockRows(nodeIds, ctx.lockFlags))) {
      tree.resetSelection()
      await ctx.showAlert(DELETE_LOCKED_MESSAGE)
      return
    }
    const accepted = await ctx.confirm(DELETE_MARKED_CONFIRM, {
      action: 'удаление',
      confirmLabel: 'Удалить',
    })
    if (!accepted) return
    await ctx.runMutation(async () => {
      try {
        await deleteNaryadWorks(naryadId, part.id, nodeIds)
      } finally {
        tree.resetSelection()
      }
    }, { reload: true })
  },
}
