import { isWorkLocked } from '../lock/lockRules.js'

export const FACT_DATE_LABEL = 'Установка фактической даты выполнения работы'

export const FACT_DATE_DIALOG_TITLE = 'Дата начала работ в новом наряде:'

export const FACT_DATE_REQUIRED = 'Укажите дату и время начала работы'

export const FACT_DATE_SAVED_MESSAGE = 'Изменения успешно сохранены!'

const STAMP = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2}):(\d{2})$/

function stamp(value) {
  return typeof value === 'string' && STAMP.test(value) ? value : null
}

/** Ровно одна незаблокированная строка открытого выполнения. */
export function canSetFactDate(selectedIds, lockFlags, closed, pending = false) {
  if (closed === true || pending) return false
  if (!(lockFlags instanceof Map) || !Array.isArray(selectedIds) || selectedIds.length !== 1) {
    return false
  }
  const id = String(selectedIds[0])
  if (!lockFlags.has(id)) return false
  return !isWorkLocked(lockFlags.get(id))
}

/** Пустая или нераспознанная дата открывает диалог на переданном текущем моменте. */
export function factDateInitial(value, now) {
  return stamp(value) ?? now
}

export function factDateFormError(value) {
  return stamp(value) ? null : FACT_DATE_REQUIRED
}
