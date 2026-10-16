const CLOSE_CONFIRM = {
  zadanie: 'Наряд-задание будет закрыто!',
  vipolnenie: 'Наряд-выполнение будет закрыто!',
}

export const CLOSE_SAVED_MESSAGE = 'Изменения успешно сохранены!'

/** Подпись единственной кнопки закрытия и открытия части наряда. */
export function closeActionLabel(part, closed) {
  if (closed === true) return 'Открыть наряд'
  if (part === 'vipolnenie') return 'Закрыть выполнение от изменения'
  return 'Закрыть задание от изменения'
}

/** Пока флаг закрытия не пришёл с заголовком карточки, кнопка не знает, что делать. */
export function canToggleClosed(closed, pending = false) {
  return (closed === true || closed === false) && !pending
}

/** Подтверждение спрашивается только при закрытии; открытие идёт без вопроса. */
export function closeConfirmMessage(part) {
  return CLOSE_CONFIRM[part] ?? CLOSE_CONFIRM.zadanie
}

/** zadanie_closenar может сдвинуть даты, поэтому после закрытия задания дерево перечитывается. */
export function reloadsAfterClose(part, closing) {
  return closing && part === 'zadanie'
}

/** Выполнение закрывается прямым update, Delphi после него сообщает об успехе. */
export function reportsSavedAfterClose(part, closing) {
  return closing && part === 'vipolnenie'
}
