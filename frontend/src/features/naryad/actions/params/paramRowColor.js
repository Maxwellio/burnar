import { delphiColorToCss } from '../color/naryadRowColors.js'

/**
 * Фон строки параметров операции.
 * isSkv — код цвета Delphi из qrParamZ / qrParamV: 14811101 совпадает,
 * 11777023 отличается, 0 — сквозного параметра нет.
 */
export function paramRowBackground(row) {
  return delphiColorToCss(row?.isSkv)
}
