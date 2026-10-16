export const REPLACE_CONFIRM =
  'Наряд-задание будет заменено на наряд-выполнение, Вы уверены, что хотите продолжить?'

export const REPLACE_SAVED_MESSAGE = 'Изменения успешно сохранены!'

/** ToolButton23 видна только при org 1 или 8. Закрытие выполнения её не гасит. */
export function canReplaceZadanie({ allowed, pending = false } = {}) {
  return allowed === true && !pending
}
