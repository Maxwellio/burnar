import { parseSkvNumber } from '../../skv/skvRules.js'

/**
 * Значение параметра операции пишется сразу, как cbParValuesExit.
 * Непрерывный параметр (ptype 1) — число, дискретное (ptype 2) — код значения.
 */

function sameNumberText(original, next) {
  const left = parseSkvNumber(original)
  const right = parseSkvNumber(next)
  if (left == null || right == null) return left == null && right == null
  if (Number.isNaN(left) || Number.isNaN(right)) return String(original) === String(next)
  return left === right
}

/**
 * Пусто сохраняется как null. Одинокий «-» и мусор не пишутся: ввод ещё не число.
 * @returns {{ save: boolean, revert?: boolean, value?: number|null }}
 */
export function continuousCommitValue(originalText, nextText) {
  const trimmed = String(nextText ?? '').trim()
  if (trimmed === '-') return { save: false, revert: true }
  if (sameNumberText(originalText, nextText)) return { save: false }
  const parsed = parseSkvNumber(nextText)
  if (Number.isNaN(parsed)) return { save: false, revert: true }
  return { save: true, value: parsed }
}

function codeText(value) {
  if (value == null || value === '') return null
  return String(value)
}

/** @returns {{ save: boolean, value?: number|null }} */
export function discreteCommitValue(currentCode, nextCode) {
  const current = codeText(currentCode)
  const next = codeText(nextCode)
  if (current === next) return { save: false }
  return { save: true, value: next == null ? null : Number(next) }
}

/**
 * Подпись пункта списка. Админу в конец дописывается zn_dparam.key этой версии операции.
 * Не-админ и пустой код остаются одним именем.
 * @returns {{ name: string, code: string|null }}
 */
export function discreteValueCaption(name, code, isAdmin) {
  const text = name == null ? '' : String(name)
  const valueCode = codeText(code)
  if (!isAdmin || valueCode == null) return { name: text, code: null }
  return { name: text, code: valueCode }
}
