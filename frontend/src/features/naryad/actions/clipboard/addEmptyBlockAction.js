import NoteAdd from '@mui/icons-material/NoteAdd'
import { addNaryadEmptyBlock } from '../../../../api/naryadyApi.js'
import { detailNodeId } from '../../workspace/naryadWorkspaceData.js'
import { canAddEmptyBlock, nameTooLong } from './clipboardRules.js'

const NAME_TOO_LONG = 'Название блока длиннее 512 символов'

/** Delphi act*_add_emptyblock: блок перед выбранной строкой. Отмена имя не записывает. */
export const addEmptyBlockAction = {
  id: 'add-empty-block',
  label: 'Добавить пустой блок',
  icon: NoteAdd,
  isEnabled: (ctx) => {
    const targetId = detailNodeId(ctx.tree.selectedIds)
    const target = targetId == null ? null : ctx.structureById?.get(Number(targetId))
    return canAddEmptyBlock(target, ctx.closed, ctx.mutation.pending, ctx.part.features.locks)
  },
  async run(ctx) {
    const targetId = detailNodeId(ctx.tree.getSelectedIds())
    const target = targetId == null ? null : ctx.getStructure()?.get(Number(targetId))
    if (!canAddEmptyBlock(target, ctx.getClosed(), ctx.mutation.isPending(), ctx.part.features.locks)) return
    const name = await ctx.prompt('Название', {
      title: 'Введите название блока',
      defaultValue: '',
      allowEmpty: true,
    })
    if (name == null) return
    if (nameTooLong(name)) {
      await ctx.showAlert(NAME_TOO_LONG)
      return
    }
    await ctx.runMutation(async () => {
      await addNaryadEmptyBlock(ctx.naryadId, ctx.part.id, Number(targetId), name)
    }, { reload: true })
  },
}
