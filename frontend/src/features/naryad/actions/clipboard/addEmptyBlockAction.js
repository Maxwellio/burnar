import NoteAdd from '@mui/icons-material/NoteAdd'
import { addNaryadEmptyBlock } from '../../../../api/naryadyApi.js'
import { detailNodeId } from '../../workspace/naryadWorkspaceData.js'
import { PLACE_AFTER, PLACE_BEFORE, canAddEmptyBlock, nameTooLong } from './clipboardRules.js'

const NAME_TOO_LONG = 'Название блока длиннее 512 символов'

/** Пустой блок рядом с выбранной строкой. Отмена ничего не создаёт, пустое имя допустимо. */
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
    const named = await ctx.prompt('Название', {
      title: 'Введите название блока',
      defaultValue: '',
      allowEmpty: true,
      choices: [PLACE_BEFORE, PLACE_AFTER],
    })
    if (named == null) return
    if (nameTooLong(named.value)) {
      await ctx.showAlert(NAME_TOO_LONG)
      return
    }
    await ctx.runMutation(async () => {
      await addNaryadEmptyBlock(ctx.naryadId, ctx.part.id, Number(targetId), named.value, named.place)
    }, { reload: true })
  },
}
