import { canDeleteBlock } from '../delete/deleteRules.js'
import { isWorkLocked } from '../lock/lockRules.js'

export const NESTED_BLOCK_WARNING =
  'Нельзя копировать и вырезать блок вместе с работами внутри него. Выделите их по отдельности.'

export const CUT_MARK_COLOR = '#87CEEB'

export const CUT_LOCKED_MESSAGE = 'Не допускается перемещение заблокированных работ!'

export const PASTE_PLACE_MESSAGE =
  'Куда поместить данные относительно выбранной записи?'

export const BLOCK_PASTE_MESSAGE =
  'Куда поместить данные относительно блока?'

export const PLACE_BEFORE = { result: 'before', label: 'Перед' }
export const PLACE_AFTER = { result: 'after', label: 'После' }

const NAME_LIMIT = 512

export function isBlock(node) {
  return node != null && (node.operlifetype == null || node.operlifetype === '')
}

export function isEmptyBlock(node) {
  return isBlock(node) && node.hasChildren !== true
}

/** id → строка структуры. Повторы схлопываются в последнюю. */
export function indexStructure(rows) {
  const byId = new Map()
  if (!Array.isArray(rows)) return byId
  for (const row of rows) {
    if (row?.id == null) continue
    byId.set(Number(row.id), row)
  }
  return byId
}

/**
 * Блок и любая строка внутри него выбраны вместе.
 * Промежуточная невыбранная строка цепочку не обрывает.
 */
export function selectionMixesBlockAndInnerWork(selectedIds, structureById) {
  if (!(structureById instanceof Map) || !Array.isArray(selectedIds) || selectedIds.length < 2) {
    return false
  }
  const selected = new Set(selectedIds.map((id) => Number(id)))
  for (const id of selected) {
    let parentId = structureById.get(id)?.parentId
    while (parentId != null) {
      const parent = structureById.get(Number(parentId))
      if (!parent) break
      if (selected.has(Number(parent.id)) && isBlock(parent)) return true
      parentId = parent.parentId
    }
  }
  return false
}

export function nestedSelectionWarning(selectedIds, structureById) {
  if (!selectionMixesBlockAndInnerWork(selectedIds, structureById)) return null
  return NESTED_BLOCK_WARNING
}

/**
 * Копирование и вырезание. Несколько строк без загруженной структуры не
 * включаем: иначе не видно, что среди них блок и работа внутри него.
 */
export function canCopyOrCut(selectedIds, closed, pending, structureById, mixes) {
  if (pending || closed === true) return false
  if (!Array.isArray(selectedIds) || selectedIds.length === 0) return false
  if (selectedIds.length > 1 && structureById == null) return false
  return !mixes
}

/** Видимый порядок дерева среди переданных id. */
export function visualOrder(ids, structureById) {
  const selected = new Set((Array.isArray(ids) ? ids : []).map((id) => Number(id)))
  if (!(structureById instanceof Map) || selected.size === 0) {
    return [...selected]
  }
  const children = new Map()
  const roots = []
  for (const node of structureById.values()) {
    const parentId = node.parentId == null ? null : Number(node.parentId)
    if (parentId == null || !structureById.has(parentId)) roots.push(node)
    else {
      if (!children.has(parentId)) children.set(parentId, [])
      children.get(parentId).push(node)
    }
  }
  const bySibling = (left, right) => {
    const delta = Number(left.prnum ?? 0) - Number(right.prnum ?? 0)
    return delta || Number(left.id) - Number(right.id)
  }
  roots.sort(bySibling)
  for (const level of children.values()) level.sort(bySibling)
  const ordered = []
  const walk = (level) => {
    for (const node of level) {
      const id = Number(node.id)
      if (selected.has(id)) ordered.push(id)
      walk(children.get(id) || [])
    }
  }
  walk(roots)
  return ordered
}

export function isCutMarked(clipboard, rowId) {
  if (!clipboard || clipboard.mode !== 'cut' || rowId == null) return false
  const id = Number(rowId)
  return Array.isArray(clipboard.nodeIds) && clipboard.nodeIds.some((item) => Number(item) === id)
}

export function canPaste(clipboard, target, closed, pending) {
  if (pending || closed === true) return false
  if (!clipboard || !Array.isArray(clipboard.nodeIds) || clipboard.nodeIds.length === 0) return false
  if (!target) return false
  return !isWorkLocked(target.locked)
}

/** Пустой блок встаёт перед выбранной строкой, поэтому у неё должен быть родитель. */
export function canAddEmptyBlock(node, closed, pending, refuseLocked) {
  if (pending || closed === true || !node) return false
  if (node.parentId == null) return false
  if (refuseLocked && isWorkLocked(node.locked)) return false
  return true
}

export function canRenameBlock(node, closed, pending) {
  return canDeleteBlock(node, closed, pending)
}

/** Внутрь — у любого блока, не только пустого. Перед и после — соседи выбранной строки. */
export function pastePlaceChoices(target) {
  const block = isBlock(target)
  const choices = [
    { result: 'before', label: block ? 'Перед' : 'Перед' },
    { result: 'after', label: block ? 'После' : 'После' },
  ]
  if (block) return [{ result: 'inside', label: 'В блок' }, ...choices]
  return choices
}

export function pastePlaceMessage(target) {
  return isBlock(target) ? BLOCK_PASTE_MESSAGE : PASTE_PLACE_MESSAGE
}

export function normalizePlace(value) {
  const text = typeof value === 'string' ? value.trim().toLowerCase() : ''
  if (text === 'before' || text === 'after' || text === 'inside') return text
  return null
}

export function nameTooLong(name) {
  return typeof name === 'string' && name.length > NAME_LIMIT
}
