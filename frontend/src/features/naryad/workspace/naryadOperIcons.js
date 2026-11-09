import { workFieldValue } from '../actions/calc/workPatches.js'

/** Лист 79/80 — Delphi Image1. В lucide-react 0.469.0 это Calculator. */
const ICON_CALCULATOR = 'calculator'
/** Пустая норма на объём у листа 79/80. Стоит перед калькулятором. */
const ICON_UNCALCULATED = 'triangle-alert'
/**
 * Лист 82 — Delphi Image2.
 * square-arrow-right-exit есть только с lucide-react 0.575.0,
 * в закреплённой 0.469.0 ближайший выход из квадрата — SquareArrowOutUpRight.
 */
const ICON_EXPERIMENTAL = 'square-arrow-out-up-right'
/** Родитель с непустым operlifetype — Delphi Image3. */
const ICON_STRUCTURE = 'folder-tree'
/** Лист с правилом корреляции — Delphi Image4, колонка n2. */
const ICON_CORRELATION = 'bell'
/** locked = 1 — Delphi Image5, колонка ord. */
const ICON_LOCKED = 'link-2'

const TYPE_COMBINATION = 79
const TYPE_ALGORITHM = 80
const TYPE_EXPERIMENTAL = 82

function hasOperType(operlifetype) {
  return operlifetype !== null && operlifetype !== undefined && String(operlifetype) !== ''
}

/**
 * Иконка типа работы в колонке «Название работы».
 * Повторяет SetOperImgs: лист 79/80 и 82, родитель с типом — структура.
 * Пустой тип (блок) и лист 78/81 без значка.
 * Корреляция и блокировка — отдельные значки, не в этой колонке.
 *
 * @param {{ operlifetype?: number|string|null, hasChildren?: boolean }|null|undefined} node
 * @returns {'calculator'|'square-arrow-out-up-right'|'folder-tree'|null}
 */
export function naryadOperIconName(node) {
  if (!hasOperType(node?.operlifetype)) {
    return null
  }
  const type = Number(node.operlifetype)
  if (!node.hasChildren) {
    if (type === TYPE_COMBINATION || type === TYPE_ALGORITHM) {
      return ICON_CALCULATOR
    }
    if (type === TYPE_EXPERIMENTAL) {
      return ICON_EXPERIMENTAL
    }
    return null
  }
  return ICON_STRUCTURE
}

/**
 * Красное предупреждение перед калькулятором, пока норма на объём пустая.
 * Ноль уже считается рассчитанным. У блока, константы, типа 82 и родителя значка нет.
 *
 * @param {{ id?: number|string, operlifetype?: number|string|null, hasChildren?: boolean, n2?: unknown }|null|undefined} node
 * @param {Map<string, object>|undefined} workOverrides
 * @returns {'triangle-alert'|null}
 */
export function naryadUncalculatedIconName(node, workOverrides) {
  if (naryadOperIconName(node) !== ICON_CALCULATOR) return null
  const n2 = workFieldValue(node, 'n2', workOverrides)
  return n2 === '' || n2 == null ? ICON_UNCALCULATED : null
}

function isFlagOn(value) {
  return value === 1 || value === '1'
}

/**
 * Image4 в колонке «Н.в. на объём»: только лист с непустым типом и kor = 1.
 * Родитель и блок значка не получают.
 */
export function naryadCorrelationIconName(node) {
  if (!node || node.hasChildren || !hasOperType(node.operlifetype)) {
    return null
  }
  return isFlagOn(node.kor) ? ICON_CORRELATION : null
}

/**
 * Image5 в колонке «№ п/п»: любая строка выполнения с locked = 1.
 */
export function naryadLockIconName(node) {
  if (!node || !isFlagOn(node.locked)) {
    return null
  }
  return ICON_LOCKED
}
