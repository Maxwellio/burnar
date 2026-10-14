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

/** Подпись единственной кнопки закрытия и открытия части наряда. */
export function closeActionLabel(part, closed) {
  if (closed === true) return 'Открыть наряд'
  if (part === 'vipolnenie') return 'Закрыть выполнение от изменения'
  return 'Закрыть задание от изменения'
}

export function isWorkLocked(locked) {
  return locked === 1 || locked === '1' || locked === true
}

/** id → locked по ответу загрузки дерева. Пока списка нет, кнопки не на что опереть. */
export function lockFlagMap(rows) {
  const flags = new Map()
  if (!Array.isArray(rows)) return flags
  for (const row of rows) {
    if (row?.id == null) continue
    flags.set(String(row.id), row.locked)
  }
  return flags
}

/** Выбранные строки с признаком из уже загруженного списка. Неизвестный id пропускается. */
export function selectedLockRows(selectedIds, lockFlags) {
  if (!(lockFlags instanceof Map) || !Array.isArray(selectedIds)) return []
  const rows = []
  for (const id of selectedIds) {
    const key = String(id)
    if (!lockFlags.has(key)) continue
    rows.push({ id, locked: lockFlags.get(key) })
  }
  return rows
}

/**
 * Только заблокированные строки — разблокировка.
 * Только открытые — блокировка.
 * Смесь — обе кнопки. Закрытая часть и пустой набор гасят обе.
 */
export function lockActionState(rows, closed, pending = false) {
  const disabled = { canLock: false, canUnlock: false }
  if (closed === true || pending || !Array.isArray(rows) || rows.length === 0) {
    return disabled
  }
  let lockedCount = 0
  let unlockedCount = 0
  for (const row of rows) {
    if (isWorkLocked(row?.locked)) lockedCount += 1
    else unlockedCount += 1
  }
  return {
    canLock: unlockedCount > 0,
    canUnlock: lockedCount > 0,
  }
}
