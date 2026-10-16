import NoteAdd from '@mui/icons-material/NoteAdd'
import { createEmptyVipolnenie } from '../../../../api/naryadyApi.js'
import { canCreateEmptyVipolnenie } from './createRules.js'

function createState(ctx, live = false) {
  const totals = live ? ctx.getTotals() : ctx.totals
  return {
    closed: live ? ctx.getClosed() : ctx.closed,
    hasRoots: totals?.hasRoots === true,
    hasVipolnenie: live ? ctx.getHasVipolnenie() : ctx.hasVipolnenie === true,
    pending: live ? ctx.mutation.isPending() : ctx.mutation.pending,
  }
}

/**
 * Delphi actCreateCopyNarVip: CALL burnar.vipolnenie_create, без подтверждения.
 * После успеха вкладка выполнения становится доступной и открывается.
 */
export const createEmptyVipolnenieAction = {
  id: 'create-empty-vipolnenie',
  label: 'Создать пустое наряд-выполнение',
  icon: NoteAdd,
  isEnabled: (ctx) => canCreateEmptyVipolnenie(createState(ctx)),
  async run(ctx) {
    if (!canCreateEmptyVipolnenie(createState(ctx, true))) return
    await ctx.runMutation(async () => {
      const header = await createEmptyVipolnenie(ctx.naryadId)
      ctx.onVipolnenieCreated?.(header)
    })
  },
}
