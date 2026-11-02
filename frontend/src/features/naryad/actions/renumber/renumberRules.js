/** Delphi actReOrderRab: соседи текущей строки, без подтверждения. */

export const RENUMBER_LABEL = 'Обновить нумерацию на данном уровне'

/** Одна выбранная строка и открытая часть. Пока флаг закрытия не пришёл, кнопку не на что опереть. */
export function canRenumber(selectedIds, closed, pending = false) {
  if (pending || closed !== false) return false
  return Array.isArray(selectedIds) && selectedIds.length === 1
    && selectedIds[0] != null && selectedIds[0] !== ''
}
