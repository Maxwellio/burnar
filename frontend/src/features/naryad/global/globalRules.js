/**
 * Правила окна общих параметров (Delphi GlobalVarUnit).
 * Черновик таблицы — объект «ключ строки → правка» с исходными значениями,
 * чтобы возврат к ним снимал жирное выделение.
 */
import {
  SKV_SAVED_MESSAGE,
  SKV_UNSAVED_CLOSE_MESSAGE,
  formatSkvNumber,
  parseSkvNumber,
  skvRowKey,
} from '../skv/skvRules.js'

export const GLOBAL_SAVED_MESSAGE = SKV_SAVED_MESSAGE
export const GLOBAL_UNSAVED_CLOSE_MESSAGE = SKV_UNSAVED_CLOSE_MESSAGE
export const SHIFR_MAX = 20
export const NM_MAX = 50
export const VALSTR_MAX = 150
export const VAL_LIMIT = 1000000

const LOCATION = new Set([5, 149, 470])

/** Скважина, куст и месторождение, а при закрытии наряда — вся таблица. */
export function globalRowEditable(closed, parcode) {
  const editable = !closed && !LOCATION.has(Number(parcode))
  return { reference: editable, value: editable }
}

const globalRowKey = skvRowKey

function normalizeZnval(value) {
  if (value == null || value === '') return null
  return String(value)
}

function normalizeValstr(value) {
  return value == null || value === '' ? null : String(value)
}

/** Ноль — пустое числовое значение, как при записи в Delphi. */
function normalizeNumber(value) {
  const number = parseSkvNumber(value)
  if (number == null || number === 0) return null
  return number
}

/** Ноль с сервера показываем пустым: в базе он значит то же, что NULL. */
function displayNumber(value) {
  const number = normalizeNumber(value)
  return number == null ? '' : formatSkvNumber(number)
}

function globalRowValues(row) {
  return {
    znval: normalizeZnval(row.znval),
    val: displayNumber(row.val),
    valstr: row.valstr ?? '',
  }
}

export function applyGlobalEdit(draft, row, field, value) {
  const key = globalRowKey(row)
  const current = draft[key]?.values ?? globalRowValues(row)
  const original = draft[key]?.original ?? globalRowValues(row)
  return {
    ...draft,
    [key]: {
      parcode: row.parcode,
      prnum: row.prnum,
      original,
      values: { ...current, [field]: value },
    },
  }
}

function changedFields(entry) {
  const { original, values } = entry
  return {
    znval: normalizeZnval(original.znval) !== normalizeZnval(values.znval),
    val: !sameNumber(original.val, values.val),
    valstr: normalizeValstr(original.valstr) !== normalizeValstr(values.valstr),
  }
}

function sameNumber(left, right) {
  const a = normalizeNumber(left)
  const b = normalizeNumber(right)
  if (Number.isNaN(a) || Number.isNaN(b)) return String(left) === String(right)
  return a === b
}

const UNCHANGED = { znval: false, val: false, valstr: false }

export function globalChangedFields(draft, row) {
  const entry = draft[globalRowKey(row)]
  if (!entry) return UNCHANGED
  return changedFields(entry)
}

export function globalCellValue(draft, row, field) {
  const key = globalRowKey(row)
  return (draft[key]?.values ?? globalRowValues(row))[field]
}

function textSame(saved, value) {
  const left = saved == null ? '' : String(saved).trim()
  const right = value == null ? '' : String(value).trim()
  return left === right
}

export function globalTextBold(saved, value) {
  return textSame(saved, value) ? 400 : 700
}

function idsKey(ids) {
  return [...(ids ?? [])].map(Number).filter(Number.isFinite).sort((a, b) => a - b).join(',')
}

function changedRows(draft) {
  return Object.values(draft ?? {}).filter((entry) => {
    const changed = changedFields(entry)
    return changed.znval || changed.val || changed.valstr
  })
}

export function isGlobalDirty(state) {
  return state.savedOwnerNar !== state.ownerNar
    || !textSame(state.savedShifr, state.shifr)
    || !textSame(state.savedNm, state.nm)
    || changedRows(state.draft).length > 0
    || idsKey(state.savedWellTypeIds) !== idsKey(state.wellTypeIds)
    || idsKey(state.savedReportParamIds) !== idsKey(state.reportParamIds)
}

/** Тип скважины — один флажок: повторный щелчок его не снимает. */
export function selectWellType(_ids, id) {
  return [id]
}

export function toggleReportParam(ids, id) {
  const current = ids ?? []
  return current.includes(id) ? current.filter((item) => item !== id) : [...current, id]
}

export function buildGlobalSavePayload(state) {
  const checksChanged = idsKey(state.savedWellTypeIds) !== idsKey(state.wellTypeIds)
    || idsKey(state.savedReportParamIds) !== idsKey(state.reportParamIds)
  return {
    ownerNar: state.ownerNar,
    shifr: state.shifr,
    nm: state.nm,
    params: changedRows(state.draft).map((entry) => ({
      parcode: entry.parcode,
      prnum: entry.prnum,
      znval: entry.values.znval == null || entry.values.znval === '' ? null : Number(entry.values.znval),
      val: normalizeNumber(entry.values.val),
      valstr: normalizeValstr(entry.values.valstr),
    })),
    checksChanged,
    wellTypeIds: [...(state.wellTypeIds ?? [])],
    reportParamIds: [...(state.reportParamIds ?? [])],
  }
}

export function invalidGlobalNumbers(draft) {
  return changedRows(draft).filter((entry) => {
    const number = parseSkvNumber(entry.values.val)
    if (Number.isNaN(number)) return true
    return number != null && Math.abs(number) >= VAL_LIMIT
  })
}

const LOCATION_SELECTION = [
  [149, 'wellId', 'wellNm'],
  [470, 'kustId', 'kustNm'],
  [5, 'mestId', 'mestNm'],
]

/**
 * Выбор в поиске скважины. Пишет скважину, куст и месторождение, если код
 * отличается от сохранённого. Число и остальные параметры не меняются.
 * Повторный выбор сохранённого кода снимает черновик этой строки.
 */
export function applyWellSelection(draft, rows, selection) {
  const next = { ...(draft ?? {}) }
  for (const [parcode, idKey, nameKey] of LOCATION_SELECTION) {
    const row = (rows ?? []).find((item) => Number(item.parcode) === parcode)
    if (!row) continue
    const key = globalRowKey(row)
    const original = draft?.[key]?.original ?? globalRowValues(row)
    const id = selection?.[idKey]
    const name = selection?.[nameKey] ?? ''
    const values = {
      ...original,
      znval: id == null || id === '' ? null : String(id),
      valstr: name,
      znnm: name,
    }
    if (!changedFields({ original, values }).znval) {
      delete next[key]
      continue
    }
    next[key] = {
      parcode: row.parcode,
      prnum: row.prnum,
      original,
      values,
    }
  }
  return next
}

/** Название в справочной ячейке: из черновика поиска или с сервера. */
export function locationReferenceLabel(draft, row) {
  const values = draft?.[globalRowKey(row)]?.values
  if (values && Object.prototype.hasOwnProperty.call(values, 'znnm')) {
    return values.znnm ?? ''
  }
  return row?.znnm ?? ''
}

export function canSaveGlobal(state) {
  const shifr = state.shifr == null ? '' : String(state.shifr).trim()
  const nm = state.nm == null ? '' : String(state.nm).trim()
  return Boolean(state.loaded)
    && !state.saving
    && isGlobalDirty(state)
    && shifr.length <= SHIFR_MAX
    && nm.length <= NM_MAX
    && invalidGlobalNumbers(state.draft).length === 0
}
