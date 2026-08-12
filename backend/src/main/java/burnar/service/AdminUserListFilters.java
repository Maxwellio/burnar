package burnar.service;

import org.springframework.util.StringUtils;

/**
 * SQL-условия чекбоксов админ-списка (query: accountKind, activeKind).
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
}
