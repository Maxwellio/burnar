import Download from '@mui/icons-material/Download'
import { importZadanieWorks } from '../../../../api/naryadyApi.js'
import { IMPORT_CONFIRM, canImportZadanieWorks } from './importRules.js'

function importState(ctx, live = false) {
  return {
    closed: live ? ctx.getClosed() : ctx.closed,
    lockFlags: live ? ctx.getLockFlags() : ctx.lockFlags,
    pending: live ? ctx.mutation.isPending() : ctx.mutation.pending,
  }
}

/**
 * Delphi actImportRabZad: datein = null, вопрос перед вызовом.
 * Отказ процедуры тоже перечитывает дерево: часть работ уже могла записаться.
 */
export const importZadanieWorksAction = {
  id: 'import-zadanie-works',
  label: 'Импортировать работы из задания',
  icon: Download,
  isEnabled: (ctx) => canImportZadanieWorks(importState(ctx)),
  async run(ctx) {
    if (!canImportZadanieWorks(importState(ctx, true))) return
    const accepted = await ctx.confirm(IMPORT_CONFIRM, {
      action: 'импорт',
      confirmLabel: 'Импортировать',
    })
    if (!accepted) return
    if (!canImportZadanieWorks(importState(ctx, true))) return
    await ctx.runMutation(async () => {
      await importZadanieWorks(ctx.naryadId)
    }, { reload: true })
  },
}
