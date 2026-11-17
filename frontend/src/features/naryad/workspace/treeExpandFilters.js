/** Скрытый filter: уходит в GET как expandAll, колонки с таким id нет. */
export const EXPAND_ALL_FILTER_ID = 'expandAll'

/** Фильтры BaseTreeTable. Пустой токен — ленивые свёрнутые корни. */
export function buildTreeExpandFilters(expandToken) {
  if (expandToken == null) return []
  return [{ id: EXPAND_ALL_FILTER_ID, value: String(expandToken) }]
}

/** Каждое «Раскрыть все» меняет значение, чтобы пакет запросил лес заново. */
export function nextExpandToken(token) {
  return (token ?? 0) + 1
}

function hasExpandAll(filters) {
  return (filters ?? []).some(
    (filter) => filter.id === EXPAND_ALL_FILTER_ID
      && filter.value != null
      && String(filter.value).trim() !== '',
  )
}

/**
 * Пакет пишет columnFilters обратно. Колоночных фильтров у дерева наряда нет:
 * если expandAll из набора пропал, раскрытие снимается.
 */
export function expandTokenAfterTableFilters(expandToken, updater) {
  const current = buildTreeExpandFilters(expandToken)
  const next = typeof updater === 'function' ? updater(current) : updater
  return hasExpandAll(next) ? expandToken : null
}
