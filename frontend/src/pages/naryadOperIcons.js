/** Лист 79/80 — Delphi Image1. В lucide-react 0.469.0 это Calculator. */
const ICON_CALCULATOR = 'calculator'
/**
 * Лист 82 — Delphi Image2.
 * square-arrow-right-exit есть только с lucide-react 0.575.0,
 * в закреплённой 0.469.0 ближайший выход из квадрата — SquareArrowOutUpRight.
 */
const ICON_EXPERIMENTAL = 'square-arrow-out-up-right'
/** Родитель с непустым operlifetype — Delphi Image3. */
const ICON_STRUCTURE = 'folder-tree'

const TYPE_COMBINATION = 79
const TYPE_ALGORITHM = 80
const TYPE_EXPERIMENTAL = 82

function hasOperType(operlifetype) {
  return operlifetype !== null && operlifetype !== undefined && String(operlifetype) !== ''
}

/**
 * Иконка типа работы в колонке «Название работы».
 * Повторяет SetOperImgs: лист 79/80 и 82, родитель с типом — структура.
 * Пустой тип (блок) и лист 78/81 без значка. Блокировка и корреляция сюда не входят.
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
