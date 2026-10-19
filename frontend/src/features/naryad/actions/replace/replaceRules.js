export const REPLACE_CONFIRM =
  'Наряд-задание будет заменено на наряд-выполнение, Вы уверены, что хотите продолжить?'

export const REPLACE_SAVED_MESSAGE = 'Изменения успешно сохранены!'

/** Кнопка доступна админу и обычному пользователю. Закрытие выполнения её не гасит. */
export function canReplaceZadanie({ pending = false } = {}) {
  return !pending
}
