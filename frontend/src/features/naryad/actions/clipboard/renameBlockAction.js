import DriveFileRenameOutline from '@mui/icons-material/DriveFileRenameOutline'
import { renameNaryadBlock } from '../../../../api/naryadyApi.js'
import { detailNodeId } from '../../workspace/naryadWorkspaceData.js'
import { canRenameBlock, nameTooLong } from './clipboardRules.js'

const NAME_TOO_LONG = 'Название блока длиннее 512 символов'

/** Delphi actRenameBlock. Пустое имя и отмена запись не делают. */
export const renameBlockAction = {
  id: 'rename-block',
  label: 'Переименовать блок',
  icon: DriveFileRenameOutline,
  isEnabled: (ctx) => {
    const targetId = detailNodeId(ctx.tree.selectedIds)
    const target = targetId == null ? null : ctx.structureById?.get(Number(targetId))
    return canRenameBlock(target, ctx.closed, ctx.mutation.pending)
  },
  async run(ctx) {
    const targetId = detailNodeId(ctx.tree.getSelectedIds())
    const target = targetId == null ? null : ctx.getStructure()?.get(Number(targetId))
    if (!canRenameBlock(target, ctx.getClosed(), ctx.mutation.isPending())) return
    const name = await ctx.prompt('Название', {
      title: 'Введите название блока',
      defaultValue: target.nm ?? '',
      allowEmpty: false,
    })
    if (name == null || name === '') return
    if (nameTooLong(name)) {
      await ctx.showAlert(NAME_TOO_LONG)
      return
    }
    await ctx.runMutation(async () => {
      await renameNaryadBlock(ctx.naryadId, ctx.part.id, Number(targetId), name)
    }, { reload: true })
  },
}
