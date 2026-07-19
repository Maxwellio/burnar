/**
 * Проверка Spring-ролей на фронте (строки как в GET /api/current-user: ROLE_USER и т.п.).
 * Меню фильтрует пункты через hasAnyRole — бэкенд пока всем отдаёт только ROLE_USER.
 */

/** Есть ли пересечение userRoles с requiredRoles. */
export function hasAnyRole(userRoles, requiredRoles) {
  if (!Array.isArray(requiredRoles) || requiredRoles.length === 0) return true
  if (!Array.isArray(userRoles) || userRoles.length === 0) return false
  const userSet = new Set(userRoles.map((r) => String(r).toUpperCase()))
  return requiredRoles.some((r) => userSet.has(String(r).toUpperCase()))
}
