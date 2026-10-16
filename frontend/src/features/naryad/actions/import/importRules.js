export const IMPORT_CONFIRM =
  'Все существующие работы в выполнении будут удалены, Вы уверены?'

/**
 * actImportRabZad: выполнение открыто и в нём нет работ.
 * Заблокированная работа тоже работа, поэтому импорт в такое выполнение закрыт.
 * Пока список блокировок не загружен, кнопку не на что опереть.
 */
export function canImportZadanieWorks({ closed, lockFlags, pending = false } = {}) {
  if (pending || closed !== false) return false
  return lockFlags instanceof Map && lockFlags.size === 0
}
