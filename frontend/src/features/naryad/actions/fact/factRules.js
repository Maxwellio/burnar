import { continuousCommitValue } from '../params/operParamRules.js'

/**
 * Ввод факта в дереве выполнения (Delphi EditedFields Fact / trGrdNarCellValChange).
 * На экране часы, как round(fact / 60, 2). В базе минуты пишет сервер.
 * Строка с burnar.factkorr остаётся только для чтения, пока нет текстов правил.
 */

export const FACT_KORR_HINT = 'Для этой работы задано правило корреляции. Ввод факта для неё пока не перенесён.'

function flagOn(value) {
  return value === 1 || value === '1'
}

/**
 * Закрытое выполнение, блокировка, блок, тип 81 и правило корреляции не правятся.
 * Родитель с обычным типом работы правится, как строка, которую Delphi может выбрать.
 */
export function canEditFact(row, closed) {
  if (closed !== false || row == null) return false
  const type = row.operlifetype
  if (type == null || type === '' || Number(type) === 81) return false
  if (flagOn(row.locked) || flagOn(row.kor)) return false
  return true
}

/** Часы в ячейке: пусто очищает факт, тот же разбор числа, что у непрерывного параметра. */
export function factCommitValue(originalText, nextText) {
  return continuousCommitValue(originalText, nextText)
}
