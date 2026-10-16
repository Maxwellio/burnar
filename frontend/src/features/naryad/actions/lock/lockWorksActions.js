import LinkIcon from '@mui/icons-material/Link'
import LinkOffIcon from '@mui/icons-material/LinkOff'
import { lockNaryadWorks, unlockNaryadWorks } from '../../../../api/naryadyApi.js'
import { lockActionState, selectedLockRows } from './lockRules.js'

function lockState(ctx) {
  return lockActionState(
    selectedLockRows(ctx.tree.selectedIds, ctx.lockFlags),
    ctx.closed,
    ctx.mutation.pending,
  )
}

/**
 * Сервер сам выбирает край выделения: блокировка — по самой поздней строке,
 * разблокировка — по самой ранней. Строки внутри диапазона меняются тоже,
 * поэтому дерево перечитывается целиком.
 */
function changeLock(lock) {
  return (ctx) => ctx.runMutation(async () => {
    const nodeIds = [...ctx.tree.getSelectedIds()]
    if (lock) await lockNaryadWorks(ctx.naryadId, nodeIds)
    else await unlockNaryadWorks(ctx.naryadId, nodeIds)
  }, { reload: true })
}

/** Delphi actLockOper. */
export const lockWorksAction = {
  id: 'lock-works',
  label: 'Блокировать текущую работу',
  icon: LinkIcon,
  isEnabled: (ctx) => lockState(ctx).canLock,
  run: changeLock(true),
}

/** Delphi actUnLockOper. */
export const unlockWorksAction = {
  id: 'unlock-works',
  label: 'Разблокировать работу',
  icon: LinkOffIcon,
  isEnabled: (ctx) => lockState(ctx).canUnlock,
  run: changeLock(false),
}
