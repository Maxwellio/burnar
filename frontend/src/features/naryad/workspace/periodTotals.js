/** Высота раскрытого блока «Итоги по периодам», как panelheight в Delphi. */
export const PERIOD_TOTALS_PANEL_HEIGHT = 160

/** Колонки кнопки «Обновить итоги»: без кодов наряда и периода и без вахтовых сумм. */
export const PERIOD_TOTAL_COLUMNS = [
  { id: 'name', title: 'Название периода', numeric: false },
  { id: 'summN', title: 'Итог Н.В.', numeric: true },
  { id: 'summF', title: 'Итог Факт.', numeric: true },
  { id: 'normativ', title: 'Сумма Н.В.', numeric: true },
  { id: 'remontN', title: 'Ремонт Н.В.', numeric: true },
  { id: 'fact', title: 'Сумма Факт.', numeric: true },
  { id: 'remontF', title: 'Ремонт Факт.', numeric: true },
]

/** Пустое значение остаётся пустым. Ноль и прочие числа — два знака, как NumberFormat грида. */
export function formatPeriodHours(value) {
  if (value == null || value === '') return ''
  const number = Number(value)
  if (!Number.isFinite(number)) return ''
  return number.toFixed(2)
}

export function initialPeriodTotalsState() {
  return { open: false, loaded: false, loading: false }
}

/** Раскрытие читает итоги один раз. Повторное открытие показывает уже загруженные строки. */
export function togglePeriodTotals(state) {
  if (state.open) {
    return { state: { ...state, open: false }, fetch: false }
  }
  const fetch = !state.loaded && !state.loading
  return {
    state: { ...state, open: true, loading: state.loading || fetch },
    fetch,
  }
}

/** Правая кнопка перечитывает итоги и не стартует второй запрос, пока первый не закончился. */
export function reloadPeriodTotals(state) {
  if (state.loading) return { state, fetch: false }
  return { state: { ...state, loading: true }, fetch: true }
}

export function periodTotalsSucceeded(state) {
  return { ...state, loaded: true, loading: false }
}

export function periodTotalsFailed(state) {
  return { ...state, loading: false }
}
