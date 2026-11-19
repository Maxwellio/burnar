/** Кнопка «Создать»: бригада выбрана и форма не занята загрузкой или сохранением. */
export function canCreateNaryad({ brigadeId, saving, loading }) {
  return !saving && !loading && brigadeId != null && String(brigadeId) !== ''
}

/**
 * Тело POST /naryady. Пустые наименование и дата не отправляются:
 * сервер пишет только переданные поля.
 */
export function buildCreatePayload({ name, brigadeId, begDate }) {
  const body = { ownerNar: Number(brigadeId) }
  const trimmed = (name ?? '').trim()
  if (trimmed) body.nameNar = trimmed
  if (begDate) body.begDate = begDate
  return body
}
