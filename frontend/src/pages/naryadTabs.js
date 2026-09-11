/** Порядок вкладок на карточке: задание слева, выполнение справа. */
export const PANEL_ORDER = ['zad', 'vip']

/**
 * Стартовый набор вкладок — как MainUnit.OpenNar:
 * форма открывается, если qrCountDefNarZad / qrCountDefNarVip вернул 1
 * (есть строка в defnarzad / defnarvip).
 * Если описателей нет — оставляем задание, чтобы страница не была пустой.
 */
export function initialOpenPanels({ hasZadanie, hasVipolnenie }) {
  if (hasZadanie && hasVipolnenie) return ['zad', 'vip']
  if (!hasZadanie && hasVipolnenie) return ['vip']
  return ['zad']
}

/** Нельзя снять последнюю вкладку; порядок всегда zad → vip. */
export function toggleOpenPanels(prev, next) {
  if (!Array.isArray(next) || next.length === 0) return prev
  return PANEL_ORDER.filter((id) => next.includes(id))
}
