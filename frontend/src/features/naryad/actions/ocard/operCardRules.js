/** Delphi actShowOk: lnkfile текущей строки, окно «Операционные карты». */

export const OPER_CARD_LABEL = 'Показать оперкарту'
export const OPER_CARD_TITLE = 'Операционные карты'
export const OPER_CARD_MISSING = 'Оперкарта не найдена'
export const OPER_CARD_POPUP_BLOCKED = 'Браузер заблокировал окно оперкарты'

/**
 * Одна выбранная строка, у которой в istochniki есть файл.
 * Закрытие части карту не прячет. Пока признак строки не пришёл, кнопку не на что включить.
 */
export function canShowOperCard(selectedIds, _closed, pending = false, work = null) {
  if (pending || work?.hasOcard !== true) return false
  return Array.isArray(selectedIds) && selectedIds.length === 1
    && selectedIds[0] != null && selectedIds[0] !== ''
}

export function operCardUrl(fileName) {
  return `/api/ocards/files/${encodeURIComponent(fileName)}`
}

function fileNameOf(row) {
  if (typeof row === 'string') return row.trim()
  if (row && typeof row.fileName === 'string') return row.fileName.trim()
  return ''
}

/**
 * Пустой ответ — сообщение. Один файл — новая вкладка.
 * Несколько — список ссылок, чтобы браузер не погасил лишние окна.
 */
export function operCardPlan(rows) {
  const names = (Array.isArray(rows) ? rows : []).map(fileNameOf).filter(Boolean)
  if (names.length === 0) return { kind: 'missing' }
  if (names.length === 1) return { kind: 'open', url: operCardUrl(names[0]) }
  return {
    kind: 'list',
    files: names.map((name) => ({ name, url: operCardUrl(name) })),
  }
}
