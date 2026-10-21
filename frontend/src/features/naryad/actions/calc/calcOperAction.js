import Calculate from '@mui/icons-material/Calculate'
import { calcNaryadOper } from '../../../../api/naryadyApi.js'
import { detailNodeId } from '../../workspace/naryadWorkspaceData.js'
import { CALC_LABEL, CALC_REBUILT_MESSAGE, canCalcOper } from './calcRules.js'

function wait(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

/**
 * Delphi actCalcOperAndSaveRes. Сохранение параметра, начатое уходом из ячейки,
 * стоит в той же очереди и заканчивается раньше расчёта.
 * Успех без сообщения: нормы и даты следующих работ правятся в уже загруженных строках.
 */
export const calcOperAction = {
  id: 'calc-oper',
  label: CALC_LABEL,
  icon: Calculate,
  isEnabled: (ctx) => canCalcOper(
    ctx.tree.selectedIds.length === 1 ? ctx.workAction : null,
    ctx.closed,
    ctx.mutation.pending,
  ),
  async run(ctx) {
    const nodeId = detailNodeId(ctx.tree.getSelectedIds())
    if (nodeId == null || !canCalcOper(ctx.workAction, ctx.getClosed(), false)) return
    await ctx.enqueueSave(async () => {
      while (ctx.mutation.isPending()) await wait(20)
      const currentId = detailNodeId(ctx.tree.getSelectedIds())
      if (currentId == null || String(currentId) !== String(nodeId) || ctx.getClosed() === true) return
      await ctx.runMutation(async () => {
        const result = await calcNaryadOper(ctx.naryadId, ctx.part.id, nodeId)
        if (result?.rebuilt) {
          await ctx.showAlert(CALC_REBUILT_MESSAGE)
          ctx.tree.reload()
          return
        }
        const patches = []
        if (result?.node?.id != null) patches.push(result.node)
        if (Array.isArray(result?.dates)) {
          for (const row of result.dates) {
            if (row?.id != null) patches.push(row)
          }
        }
        if (patches.length > 0) ctx.workValues.apply(patches)
        ctx.refreshTotals()
      })
    })
  },
}
