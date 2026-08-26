/**
 * Удаление человека/карьеры: сначала предпроверка «мастер в наряде».
 * Если blocked — сразу диалог-предупреждение без кнопки «Удалить».
 */

export async function runPersonDelete({
  peopleId,
  fetchBlock,
  confirm,
  alert,
  deletePerson,
}) {
  let block
  try {
    block = await fetchBlock(peopleId)
  } catch (e) {
    await alert(e?.message || 'Не удалось проверить удаление пользователя')
    return false
  }
  if (block?.blocked) {
    await alert(block.message)
    return false
  }
  const ok = await confirm('Удалить пользователя?', { action: 'удаление' })
  if (!ok) return false
  try {
    await deletePerson(peopleId)
    return true
  } catch (e) {
    await alert(e?.message || 'Не удалось удалить пользователя')
    return false
  }
}

export async function runCareerDelete({
  peopleId,
  careerId,
  fetchBlock,
  fetchCareerTotal,
  confirm,
  alert,
  deleteCareer,
}) {
  let block
  try {
    block = await fetchBlock(peopleId, careerId)
  } catch (e) {
    await alert(e?.message || 'Не удалось проверить удаление карьеры')
    return { deleted: false }
  }
  if (block?.blocked) {
    await alert(block.message)
    return { deleted: false }
  }

  let careerTotal
  try {
    // Без orgUnitId: последняя карьера в БД, не по видимым в фильтре
    careerTotal = await fetchCareerTotal(peopleId)
  } catch (e) {
    await alert(e?.message || 'Не удалось проверить карьеры')
    return { deleted: false }
  }

  const isOnlyCareer = careerTotal === 1
  const message = isOnlyCareer
    ? 'Удалить выбранную карьеру пользователя? Вместе с ней будет удалён и сам пользователь.'
    : 'Удалить выбранную карьеру пользователя?'
  const ok = await confirm(message, { action: 'удаление' })
  if (!ok) return { deleted: false }

  try {
    await deleteCareer(peopleId, careerId)
    return { deleted: true, isOnlyCareer }
  } catch (e) {
    await alert(e?.message || 'Не удалось удалить карьеру')
    return { deleted: false }
  }
}
