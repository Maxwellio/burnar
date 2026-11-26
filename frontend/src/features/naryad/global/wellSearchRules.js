/**
 * Поиск скважины (Delphi SkvFind): поля, пороги техместа и пометка текущей строки.
 * Выбор записывает черновик общих параметров, см. applyWellSelection.
 */

export const TEHMESTO_TOO_SHORT_MESSAGE =
  'Для выполнения загрузки данных по скважинам из ИС "Бурение"\n'
  + 'необходимо в поле "Тех. место" указать не менее 9 символов'

export const REFRESH_CONFIRM_MESSAGE =
  'Загрузка данных может занять несколько минут.\nПродолжить?'

export const CLOSED_SEARCH_HINT =
  'Наряд закрыт от изменений. Поиск скважины недоступен.'

export const MISSING_WELL_PARAM = 'В наряде нет параметра «Скважина»'

export function refreshDoneMessage(tehmesto) {
  return `Данные по тех.месту: ${tehmesto}*  обновлены`
}

export function stripWellPrefix(name) {
  return stripFirst(name, 'СКВ.')
}

export function stripKustPrefix(name) {
  return stripFirst(name, 'К.')
}

/** В фильтр поиска техместо попадает только длиннее 4 символов. */
export function tehmestoSearched(text) {
  return (text ?? '').length > 4
}

/** Обновление из ИС «Бурение» требует не меньше 9 символов. */
export function tehmestoRefreshable(text) {
  return (text ?? '').length >= 9
}

export function searchSeed(rows, draft) {
  const well = shown(rows, draft, 149)
  const mest = shown(rows, draft, 5)
  const kust = shown(rows, draft, 470)
  return {
    skv: stripWellPrefix(well.name),
    mest: mest.name,
    kust: stripKustPrefix(kust.name),
    wellId: well.id,
  }
}

export function shouldSearchOnOpen(seed) {
  return [seed?.skv, seed?.mest, seed?.kust].some((value) => value != null && value !== '')
}

export function hasWellParam(rows) {
  return (rows ?? []).some((row) => Number(row.parcode) === 149)
}

/** Стабильный адрес BaseTable: ширины колонок не зависят от текста поиска. */
export const WELL_SEARCH_URL = '/naryady/wells'

/**
 * Фильтры BaseTable уходят query-параметрами.
 * Пока поиск не запускали, `ready=0` — сервер отдаёт пустой список и шапка таблицы уже на месте.
 */
export function wellSearchFilters(criteria, currentWellId) {
  if (criteria == null) return [{ id: 'ready', value: '0' }]
  const filters = []
  const put = (id, value) => {
    if (value == null || value === '') return
    filters.push({ id, value: String(value) })
  }
  put('skv', criteria.skv)
  put('mest', criteria.mest)
  put('kust', criteria.kust)
  put('tehmesto', criteria.tehmesto)
  put('current', currentWellId)
  return filters
}

function stripFirst(name, token) {
  const text = name == null ? '' : String(name)
  const index = text.toLowerCase().indexOf(token.toLowerCase())
  if (index < 0) return text
  return text.slice(0, index) + text.slice(index + token.length)
}

function shown(rows, draft, parcode) {
  const row = (rows ?? []).find((item) => Number(item.parcode) === parcode)
  if (!row) return { name: '', id: null }
  const values = draft?.[`${row.parcode}:${row.prnum}`]?.values
  const name = values && Object.prototype.hasOwnProperty.call(values, 'znnm')
    ? (values.znnm ?? '')
    : (row.znnm ?? '')
  const id = values && Object.prototype.hasOwnProperty.call(values, 'znval')
    ? values.znval
    : row.znval
  return { name, id: id ?? null }
}
