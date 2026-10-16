import Lock from '@mui/icons-material/Lock'
import LockOpen from '@mui/icons-material/LockOpen'
import { setNaryadPartClosed } from '../../../../api/naryadyApi.js'
import {
  CLOSE_SAVED_MESSAGE,
  canToggleClosed,
  closeActionLabel,
  closeConfirmMessage,
  reloadsAfterClose,
  reportsSavedAfterClose,
} from './closeRules.js'

/**
 * Одна кнопка: закрыть часть от изменений (actCloseNarZad / actCloseNarVip)
 * или открыть закрытую (actOpenDefNar / actOpenNarVip).
 * Проверку «все работы выполнения заблокированы» делает сервер.
 */
export const closePartAction = {
  id: 'close-part',
  getLabel: (ctx) => closeActionLabel(ctx.part.id, ctx.closed === true),
  getIcon: (ctx) => (ctx.closed === true ? Lock : LockOpen),
  isEnabled: (ctx) => canToggleClosed(ctx.closed, ctx.mutation.pending),
  async run(ctx) {
    const partId = ctx.part.id
    const closing = ctx.getClosed() !== true
    if (closing) {
      const accepted = await ctx.confirm(closeConfirmMessage(partId), {
        action: 'закрытие',
        confirmLabel: 'Закрыть',
      })
      if (!accepted) return
    }
    await ctx.runMutation(async () => {
      const result = await setNaryadPartClosed(ctx.naryadId, partId, closing)
      ctx.onClosedChange?.(result?.closed === true)
      if (reportsSavedAfterClose(partId, closing)) {
        await ctx.showAlert(CLOSE_SAVED_MESSAGE)
      }
    }, { reload: reloadsAfterClose(partId, closing) })
  },
}
