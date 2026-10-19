import SwapHoriz from '@mui/icons-material/SwapHoriz'
import { replaceZadanieFromVipolnenie } from '../../../../api/naryadyApi.js'
import { REPLACE_CONFIRM, REPLACE_SAVED_MESSAGE, canReplaceZadanie } from './replaceRules.js'

/**
 * Delphi ToolButton23: CALL burnar.copy_vip_to_zad.
 * Кнопкой пользуются и админ, и обычный пользователь. Проверка org 1/8
 * в FormCreate смотрит карьеру и в вебе прячет админа без должности.
 * Дерево задания перечитывает страница, выполнение остаётся как есть.
 */
export const replaceZadanieAction = {
  id: 'replace-zadanie',
  label: 'Заменить задание на выполнение',
  icon: SwapHoriz,
  isEnabled: (ctx) => canReplaceZadanie({ pending: ctx.mutation.pending }),
  async run(ctx) {
    if (!canReplaceZadanie({ pending: ctx.mutation.isPending() })) return
    const accepted = await ctx.confirm(REPLACE_CONFIRM, {
      action: 'замену',
      confirmLabel: 'Заменить',
    })
    if (!accepted) return
    if (!canReplaceZadanie({ pending: ctx.mutation.isPending() })) return
    await ctx.runMutation(async () => {
      const header = await replaceZadanieFromVipolnenie(ctx.naryadId)
      ctx.onZadanieReplaced?.(header)
      await ctx.showAlert(REPLACE_SAVED_MESSAGE)
    })
  },
}
