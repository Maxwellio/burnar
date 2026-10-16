/**
 * actCreateCopyNarVip: пустое выполнение создаётся один раз,
 * только у закрытого задания, в котором есть корневые работы.
 */
export function canCreateEmptyVipolnenie({
  closed,
  hasRoots,
  hasVipolnenie,
  pending = false,
} = {}) {
  if (pending || closed !== true || hasRoots !== true || hasVipolnenie === true) return false
  return true
}
