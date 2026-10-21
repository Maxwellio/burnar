/**
 * Расчёт операции (Delphi actCalcOperAndSaveRes / tbCalcOperClick).
 * Кнопка только для комбинации (79) и алгоритма (80): у типа 82 она в Delphi
 * активна, но обработчик ничего не делает. Лист — без вложенных работ.
 */

export const CALC_LABEL = 'Расчёт нормы'

/** Текст MessageBox после rebuild, как в CommonNarZadUnit / CommonNarVipUnit. */
export const CALC_REBUILT_MESSAGE =
  'Операция была перестроена проверьте параметры и повторите рассчет!'

export function canCalcOper(work, closed, pending = false) {
  if (pending || closed !== false || work == null) return false
  const type = Number(work.operlifetype)
  if (type !== 79 && type !== 80) return false
  if (work.hasChildren === true) return false
  if (work.locked === 1 || work.locked === '1' || work.locked === true) return false
  return true
}
