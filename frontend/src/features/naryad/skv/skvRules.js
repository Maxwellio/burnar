/**
 * Правила окна сквозных параметров (Delphi formSkvZadVar / formSkvVipVar).
 * Черновик — объект «ключ строки → правка»; правка хранит исходные значения,
 * чтобы возврат к ним не считался изменением.
 */

export const SKV_SAVED_MESSAGE = 'Изменения успешно сохранены!'

export const SKV_CONFIRM_MESSAGE = 'Внимание! Вы изменили сквозные параметры наряда. '
  + 'Расчетные работы, в которых сквозные параметры являются нормообразующими, будут обнулены. '
  + 'Вы уверены, что хотите изменить сквозные параметры?'

export const SKV_UNSAVED_CLOSE_MESSAGE = 'Изменения не сохранены. Закрыть?'

export const SKV_BEG_DATE_REQUIRED = 'Укажите дату и время начала работ'

/** Отступ между окнами задания и выполнения, открытыми рядом. */
export const SKV_WINDOW_GAP = 16

export function skvRowKey(row) {
  return `${row.parcode}:${row.prnum}`
}

/** Число из поля ввода: запятая или точка, пусто → null, мусор → NaN. */
export function parseSkvNumber(text) {
  if (text == null) return null
  const trimmed = String(text).trim()
  if (trimmed === '' || trimmed === '-') return null
  const value = Number(trimmed.replace(',', '.'))
  return Number.isFinite(value) ? value : Number.NaN
}

/** Как Delphi EdKeyPress: цифры, один разделитель «,», один ведущий «-». */
export function sanitizeSkvNumberInput(text) {
  const source = String(text ?? '').replace('.', ',')
  let result = ''
  let hasSeparator = false
  for (const char of source) {
    if (char >= '0' && char <= '9') {
      result += char
    } else if (char === ',' && !hasSeparator) {
      hasSeparator = true
      result += char
    } else if (char === '-' && result === '') {
      result += char
    }
  }
  return result
}

/** Значение val из ответа сервера (numeric(8,4)) в текст поля без лишних нулей. */
export function formatSkvNumber(value) {
  if (value == null || value === '') return ''
  const number = Number(value)
  if (!Number.isFinite(number)) return String(value)
  return String(number).replace('.', ',')
}

function normalizeZnval(value) {
  if (value == null || value === '') return null
  return String(value)
}

function normalizeValstr(value) {
  return value == null || value === '' ? null : String(value)
}

function sameNumberText(a, b) {
  const left = parseSkvNumber(a)
  const right = parseSkvNumber(b)
  if (left == null || right == null) return left == null && right == null
  if (Number.isNaN(left) || Number.isNaN(right)) return String(a) === String(b)
  return left === right
}

/** Исходные значения строки в виде, в котором их правят ячейки. */
export function skvRowValues(row) {
  return {
    znval: normalizeZnval(row.znval),
    val: formatSkvNumber(row.val),
    valstr: row.valstr ?? '',
  }
}

/** Новый черновик после правки одного поля строки. */
export function applySkvEdit(draft, row, field, value) {
  const key = skvRowKey(row)
  const original = draft[key]?.original ?? skvRowValues(row)
  const current = draft[key]?.values ?? original
  const values = { ...current, [field]: value }
  return {
    ...draft,
    [key]: { parcode: row.parcode, prnum: row.prnum, original, values },
  }
}

export function skvCellValue(draft, row, field) {
  const key = skvRowKey(row)
  return (draft[key]?.values ?? skvRowValues(row))[field]
}

function changedFields(entry) {
  const { original, values } = entry
  return {
    znval: normalizeZnval(original.znval) !== normalizeZnval(values.znval),
    val: !sameNumberText(original.val, values.val),
    valstr: normalizeValstr(original.valstr) !== normalizeValstr(values.valstr),
  }
}

export function changedSkvRows(draft) {
  return Object.values(draft).filter((entry) => {
    const changed = changedFields(entry)
    return changed.znval || changed.val || changed.valstr
  })
}

/**
 * *_set_skvparam получает только znval и val: строковое значение на нормы
 * не влияет, и вопрос об обнулении расчётов не нужен.
 */
export function skvNeedsResetConfirm(draft) {
  return Object.values(draft).some((entry) => {
    const changed = changedFields(entry)
    return changed.znval || changed.val
  })
}

export function invalidSkvNumbers(draft) {
  return changedSkvRows(draft).filter((entry) => Number.isNaN(parseSkvNumber(entry.values.val)))
}

function minuteOf(value) {
  if (!value) return null
  return String(value).slice(0, 16)
}

export function skvBegDateChanged(savedBegDate, begDate) {
  return minuteOf(savedBegDate) !== minuteOf(begDate)
}

export function isSkvDirty({ savedBegDate, begDate, draft }) {
  return skvBegDateChanged(savedBegDate, begDate) || changedSkvRows(draft).length > 0
}

export function canSaveSkv({ loaded, readOnly, saving, begDate, dirty, draft }) {
  return Boolean(loaded)
    && !readOnly
    && !saving
    && Boolean(begDate)
    && dirty
    && invalidSkvNumbers(draft).length === 0
}

/** Тело PUT .../skv: дата и только изменённые строки. */
export function buildSkvSavePayload(begDate, draft) {
  return {
    begDate,
    params: changedSkvRows(draft).map((entry) => ({
      parcode: entry.parcode,
      prnum: entry.prnum,
      znval: entry.values.znval == null || entry.values.znval === '' ? null : Number(entry.values.znval),
      val: parseSkvNumber(entry.values.val),
      valstr: normalizeValstr(entry.values.valstr),
    })),
  }
}

/**
 * Смещение от центра экрана для окна, которое открывается рядом с уже открытым:
 * справа, если помещается, иначе слева; на узком экране — с наложением.
 */
export function sideBySidePosition({ openerRect, width, height, viewportWidth, viewportHeight, gap = SKV_WINDOW_GAP }) {
  if (!openerRect) return { x: 0, y: 0 }
  const centeredLeft = (viewportWidth - width) / 2
  const centeredTop = (viewportHeight - height) / 2
  let left = openerRect.right + gap
  if (left + width > viewportWidth - gap) {
    left = openerRect.left - gap - width
  }
  left = Math.min(Math.max(gap, left), Math.max(gap, viewportWidth - width - gap))
  const top = Math.min(Math.max(0, openerRect.top), Math.max(0, viewportHeight - height))
  return { x: Math.round(left - centeredLeft), y: Math.round(top - centeredTop) }
}
