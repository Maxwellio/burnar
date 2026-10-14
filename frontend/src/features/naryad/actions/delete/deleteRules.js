import { isWorkLocked } from '../lock/lockRules.js'

export const DELETE_MARKED_CONFIRM =
  'Отмеченные работы будут удалены, Вы уверены, что хотите продолжить?'

export const DELETE_BLOCK_CONFIRM =
  'Удаление блока приведет к переносу внутренних работ на его уровень!\nВы уверены, что хотите продолжить?'

export const DELETE_LOCKED_MESSAGE = 'Не допускается удаление заблокированных работ!'

/** actDelSelOpers: есть выделенные и часть не закрыта. Одна строка и несколько — одна кнопка. */
export function canDeleteMarkedWorks(selectedIds, closed, pending = false) {
  if (pending || closed === true) return false
  return Array.isArray(selectedIds) && selectedIds.length > 0
}

/** Vip tbDelSelOpersClick отказывается от всего набора, если среди выделенных есть locked = 1. */
export function selectionHasLockedWork(rows) {
  return Array.isArray(rows) && rows.some((row) => isWorkLocked(row?.locked))
}

/**
 * act*_del_block: пустой блок, не заблокирован, не системный (RS = 0), часть открыта.
 * В вебе нет отдельного «текущего» узла, поэтому сюда приходит только единственная выбранная строка.
 */
export function canDeleteBlock(action, closed, pending = false) {
  if (pending || closed === true || action == null) return false
  if (isWorkLocked(action.locked)) return false
  if (String(action.rs) !== '0') return false
  return action.operlifetype == null || action.operlifetype === ''
}
