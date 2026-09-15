/** Скрытый filter: уходит в GET как expandAll, колонки с таким id нет. */
export const EXPAND_ALL_FILTER_ID = 'expandAll'

export const isActiveColumnFilter = (filter) =>
  filter.id !== EXPAND_ALL_FILTER_ID &&
  filter.value != null &&
  String(filter.value).trim() !== ''

/** Filters for BaseTreeTable, including expandAll when the token is set. */
export function buildCatalogTableFilters(filters, expandToken) {
  return expandToken == null
    ? [...filters]
    : [...filters, { id: EXPAND_ALL_FILTER_ID, value: String(expandToken) }]
}

/**
 * Apply a BaseTreeTable setFilters updater. Clearing column search also
 * drops expandAll, otherwise the next packet would expand the whole forest.
 */
export function applyCatalogFilterChange({ prevFilters, expandToken, updater }) {
  const current =
    expandToken == null
      ? prevFilters
      : [...prevFilters, { id: EXPAND_ALL_FILTER_ID, value: String(expandToken) }]
  const raw = typeof updater === 'function' ? updater(current) : updater
  const next = (raw ?? []).filter((f) => f.id !== EXPAND_ALL_FILTER_ID)
  const hadColumnFilters = prevFilters.some(isActiveColumnFilter)
  const hasColumnFilters = next.some(isActiveColumnFilter)
  return {
    filters: next,
    expandToken: hadColumnFilters && !hasColumnFilters ? null : expandToken,
  }
}
