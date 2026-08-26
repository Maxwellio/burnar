package burnar.service;

import org.springframework.util.StringUtils;

/**
 * SQL-условия чекбоксов и ORDER BY админ-списка
 * (query: accountKind, activeKind, sortBy, sortDir).
 */
final class AdminUserListFilters {

    private AdminUserListFilters() {
    }

    /**
     * responsible → без учётки; users → с учёткой; иначе без условия.
     */
    static void appendAccountKind(StringBuilder where, String accountKind) {
        if (!StringUtils.hasText(accountKind)) {
            return;
        }
        switch (accountKind.trim()) {
            case "responsible" -> where.append("AND u.users_id IS NULL ");
            case "users" -> where.append("AND u.users_id IS NOT NULL ");
            default -> {
                // неизвестное значение игнорируем
            }
        }
    }

    /**
     * active → u.active = 1; inactive → u.active = 0; иначе без условия.
     * Люди без учётки при этих фильтрах не попадают в выборку.
     */
    static void appendActiveKind(StringBuilder where, String activeKind) {
        if (!StringUtils.hasText(activeKind)) {
            return;
        }
        switch (activeKind.trim()) {
            case "active" -> where.append("AND u.active = 1 ");
            case "inactive" -> where.append("AND u.active = 0 ");
            default -> {
                // неизвестное значение игнорируем
            }
        }
    }

    /**
     * ORDER BY для внешней выборки (алиасы: active, dtenter, dtout, fio, id).
     * Неизвестные sortBy игнорируем → как без сортировки (fio).
     * Пустой статус/даты всегда в конце; статус по тексту «Отключен»/«Подключен»,
     * затем ФИО.
     */
    static String orderByClause(String sortBy, String sortDir) {
        String dir = "desc".equalsIgnoreCase(sortDir) ? "DESC" : "ASC";
        String tie = "fio, id ";
        if (!StringUtils.hasText(sortBy)) {
            return "ORDER BY " + tie;
        }
        return switch (sortBy.trim()) {
            case "active" ->
                    "ORDER BY CASE WHEN active IS NULL THEN 1 ELSE 0 END, "
                            + "CASE active WHEN 1 THEN 'Подключен' WHEN 0 THEN 'Отключен' END "
                            + dir + ", "
                            + tie;
            case "dtEnter" ->
                    "ORDER BY dtenter " + dir + " NULLS LAST, " + tie;
            case "dtOut" ->
                    "ORDER BY dtout " + dir + " NULLS LAST, " + tie;
            default -> "ORDER BY " + tie;
        };
    }
}
