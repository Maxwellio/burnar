/**
 * Проверка Spring-ролей на фронте (строки как в GET /api/current-user: ROLE_USER и т.п.).
 */

/** Есть ли пересечение userRoles с requiredRoles. */
export function hasAnyRole(userRoles, requiredRoles) {
  if (!Array.isArray(requiredRoles) || requiredRoles.length === 0) return true
  if (!Array.isArray(userRoles) || userRoles.length === 0) return false
  const userSet = new Set(userRoles.map((r) => String(r).toUpperCase()))
  return requiredRoles.some((r) => userSet.has(String(r).toUpperCase()))
}

/** Админ по ROLE_ADMIN (burnar.admin-users на бэке). */
export function isAdmin(user) {
  return hasAnyRole(user?.roles, ['ROLE_ADMIN'])
}
