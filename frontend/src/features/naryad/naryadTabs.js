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

/**
 * Вкладка «Выполнение» включается только когда есть строка defnarvip.
 * Пока её нет, повторный клик по заданию не переключает на выполнение.
 */
export function isVipolneniePanelEnabled(hasVipolnenie) {
  return hasVipolnenie === true
}

/**
 * Пустой next при одной открытой вкладке переключает на другую,
 * если та доступна. Иначе последнюю вкладку снять нельзя; порядок всегда zad → vip.
 * available ограничивает вкладки, которых у наряда ещё нет.
 */
export function toggleOpenPanels(prev, next, options = {}) {
  const available = Array.isArray(options.available) ? options.available : PANEL_ORDER
  const allowed = PANEL_ORDER.filter((id) => available.includes(id))
  if (!Array.isArray(next)) return prev
  if (next.length === 0 && Array.isArray(prev) && prev.length === 1) {
    const other = prev[0] === 'zad' ? 'vip' : 'zad'
    if (!allowed.includes(other)) return prev
    return [other]
  }
  if (next.length === 0) return prev
  const picked = allowed.filter((id) => next.includes(id))
  if (picked.length === 0) return prev
  return picked
}
