import SwapHoriz from '@mui/icons-material/SwapHoriz'
import { replaceZadanieFromVipolnenie } from '../../../../api/naryadyApi.js'
import { REPLACE_CONFIRM, REPLACE_SAVED_MESSAGE, canReplaceZadanie } from './replaceRules.js'

function replaceState(ctx, live = false) {
  return {
    allowed: live ? ctx.getReplaceZadanieAllowed() : ctx.replaceZadanieAllowed === true,
    pending: live ? ctx.mutation.isPending() : ctx.mutation.pending,
  }
}

/**
 * Delphi ToolButton23: CALL burnar.copy_vip_to_zad.
 * Кнопка скрыта, если орг. единица пользователя не 1 и не 8.
 * Дерево задания перечитывает страница, выполнение остаётся как есть.
 */
export const replaceZadanieAction = {
  id: 'replace-zadanie',
  label: 'Заменить задание на выполнение',
  icon: SwapHoriz,
  isVisible: (ctx) => ctx.replaceZadanieAllowed === true,
  isEnabled: (ctx) => canReplaceZadanie(replaceState(ctx)),
  async run(ctx) {
    if (!canReplaceZadanie(replaceState(ctx, true))) return
    const accepted = await ctx.confirm(REPLACE_CONFIRM, {
      action: 'замену',
      confirmLabel: 'Заменить',
    })
    if (!accepted) return
    if (!canReplaceZadanie(replaceState(ctx, true))) return
    await ctx.runMutation(async () => {
      const header = await replaceZadanieFromVipolnenie(ctx.naryadId)
      ctx.onZadanieReplaced?.(header)
      await ctx.showAlert(REPLACE_SAVED_MESSAGE)
    })
  },
}
