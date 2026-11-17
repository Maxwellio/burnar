import { isBlock, isEmptyBlock } from '../features/naryad/actions/clipboard/clipboardRules.js'
import { isWorkLocked } from '../features/naryad/actions/lock/lockRules.js'
import { detailNodeId } from '../features/naryad/workspace/naryadWorkspaceData.js'

export const CATALOG_BEFORE_LOCKED_MESSAGE = 'Нельзя добавлять работы перед заблокированной!'
export const CATALOG_EMPTY_BLOCK_MESSAGE =
  'Данный блок пустой! Выберите действие:\nОК — данные будут добавлены внутрь блока\nОТМЕНА — данные будут добавлены перед блоком'

export const PLACE_BEFORE = { result: 'before', label: 'Перед текущей' }
export const PLACE_AFTER = { result: 'after', label: 'После текущей' }
export const PLACE_INSIDE = { result: 'inside', label: 'В блок' }
export const PLACE_END = { result: 'end', label: 'В конец раздела' }

function pad2(value) {
  return String(value).padStart(2, '0')
}

function isValidDate(value) {
  return value instanceof Date && !Number.isNaN(value.getTime())
}

/** Локальная дата → ISO без времени (00:00:00). */
export function catalogDateFromPicker(value) {
  if (!isValidDate(value)) return null
  return `${value.getFullYear()}-${pad2(value.getMonth() + 1)}-${pad2(value.getDate())}T00:00:00`
}

/** Сегодня как ISO без времени (начало суток). */
export function defaultCatalogDateIso(now = new Date()) {
  return catalogDateFromPicker(now)
}

export function catalogDateToPicker(iso) {
  if (!iso || typeof iso !== 'string') return null
  const match = /^(\d{4})-(\d{2})-(\d{2})/.exec(iso.trim())
  if (!match) return null
  const date = new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]))
  return isValidDate(date) ? date : null
}

export function normalizeCatalogPlace(value) {
  const text = typeof value === 'string' ? value.trim().toLowerCase() : ''
  if (text === 'before' || text === 'after' || text === 'end' || text === 'inside') return text
  return null
}

/**
 * Раздел каталога: oper явно null/''.
 * oper === undefined — ещё не известно (ждём кэш/запрос); для пустого раздела кнопку не включаем.
 */
export function isCatalogSection(node) {
  if (node == null || node.oper === undefined) return false
  return node.oper == null || node.oper === ''
}

/** Нормализация ответа API / кэша: у раздела oper = null, у операции — число. */
export function normalizeCatalogNode(node) {
  if (node == null || node.id == null) return null
  let oper = node.oper
  if (oper === undefined || oper === null || oper === '') {
    oper = null
  } else {
    oper = Number(oper)
  }
  return {
    id: Number(node.id),
    name: node.name ?? null,
    oper,
  }
}

export function resolveCatalogAnchor(selectedIds, structureById) {
  const id = detailNodeId(selectedIds)
  if (id == null) return null
  if (!(structureById instanceof Map)) return { id: Number(id), node: null }
  const node = structureById.get(Number(id)) ?? null
  return { id: Number(id), node }
}

export function catalogTreeEmpty(structureById) {
  return structureById instanceof Map && structureById.size === 0
}

/**
 * Общая доступность кнопки вставки (без учёта конкретного place).
 * @param {object} args
 */
export function canInsertFromCatalog({
  dateIn,
  catalogNode,
  mode,
  partClosed,
  hasPart,
  pending,
  treeEmpty,
  anchor,
}) {
  if (pending || partClosed === true || hasPart === false) return false
  if (!dateIn) return false
  if (!catalogNode || catalogNode.id == null) return false
  if (mode === 'empty' && !isCatalogSection(catalogNode)) return false
  if (!treeEmpty && (!anchor || anchor.id == null)) return false
  return true
}

/** Пункт меню place доступен при уже включённой кнопке. */
export function canUseCatalogPlace(place, { treeEmpty, anchor, refuseLocked }) {
  const normalized = normalizeCatalogPlace(place)
  if (!normalized) return false
  if (treeEmpty) return normalized === 'before' || normalized === 'after' || normalized === 'end'
  if (!anchor?.node) return false
  if (normalized === 'end' || normalized === 'inside') {
    if (!isBlock(anchor.node)) return false
    if (refuseLocked && isWorkLocked(anchor.node.locked)) return false
    return true
  }
  if (normalized === 'before' || normalized === 'after') {
    if (refuseLocked && isWorkLocked(anchor.node.locked)) return false
    return true
  }
  return false
}

export function catalogPlaceChoices({ treeEmpty, anchor, refuseLocked }) {
  return [PLACE_BEFORE, PLACE_AFTER, PLACE_INSIDE, PLACE_END].filter((item) =>
    canUseCatalogPlace(item.result, { treeEmpty, anchor, refuseLocked }))
}

/** Пустой блок + before → нужен диалог внутрь/перед. */
export function needsEmptyBlockPlacePrompt(place, anchor, treeEmpty) {
  if (treeEmpty || normalizeCatalogPlace(place) !== 'before') return false
  return isEmptyBlock(anchor?.node)
}

/**
 * После диалога пустого блока: true → inside, false → before, null → отмена.
 * @param {boolean|null} inside
 */
export function resolveEmptyBlockPlace(inside) {
  if (inside === true) return 'inside'
  if (inside === false) return 'before'
  return null
}
