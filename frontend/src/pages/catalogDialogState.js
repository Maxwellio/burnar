/** First open of the catalog dialog on this naryad card. */
export function nextCatalogHasOpened(hasOpened, open) {
  return hasOpened || Boolean(open)
}

/**
 * After the first open, keep Dialog children mounted so tree expansion
 * and lazy-loaded children survive close/reopen on the same naryad card.
 */
export function catalogTreeKeepMounted(hasOpened) {
  return Boolean(hasOpened)
}
