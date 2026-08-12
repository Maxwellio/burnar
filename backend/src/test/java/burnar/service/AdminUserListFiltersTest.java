package burnar.service;

import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;

/**
 * Условия чекбоксов админ-списка (accountKind / activeKind).
 */
class AdminUserListFiltersTest {

    @Test
    void blankAccountKindAddsNothing() {
        StringBuilder where = new StringBuilder("WHERE 1=1 ");
        AdminUserListFilters.appendAccountKind(where, null);
        AdminUserListFilters.appendAccountKind(where, "");
        AdminUserListFilters.appendAccountKind(where, "  ");
        assertEquals("WHERE 1=1 ", where.toString());
    }

    @Test
    void responsibleMeansNoUsersRow() {
        StringBuilder where = new StringBuilder("WHERE 1=1 ");
        AdminUserListFilters.appendAccountKind(where, "responsible");
        assertTrue(where.toString().contains("u.users_id IS NULL"));
        assertFalse(where.toString().contains("IS NOT NULL"));
    }

    @Test
    void usersMeansHasUsersRow() {
        StringBuilder where = new StringBuilder("WHERE 1=1 ");
        AdminUserListFilters.appendAccountKind(where, "users");
        assertTrue(where.toString().contains("u.users_id IS NOT NULL"));
    }

    @Test
    void unknownAccountKindIgnored() {
        StringBuilder where = new StringBuilder("WHERE 1=1 ");
        AdminUserListFilters.appendAccountKind(where, "other");
        assertEquals("WHERE 1=1 ", where.toString());
    }

    @Test
    void blankActiveKindAddsNothing() {
        StringBuilder where = new StringBuilder("WHERE 1=1 ");
        AdminUserListFilters.appendActiveKind(where, null);
        AdminUserListFilters.appendActiveKind(where, "");
        assertEquals("WHERE 1=1 ", where.toString());
    }

    @Test
    void activeMeansActiveEqualsOne() {
        StringBuilder where = new StringBuilder("WHERE 1=1 ");
        AdminUserListFilters.appendActiveKind(where, "active");
        assertTrue(where.toString().contains("u.active = 1"));
    }

    @Test
    void inactiveMeansActiveEqualsZero() {
        StringBuilder where = new StringBuilder("WHERE 1=1 ");
        AdminUserListFilters.appendActiveKind(where, "inactive");
        assertTrue(where.toString().contains("u.active = 0"));
    }

    @Test
    void bothAxesCanCombine() {
        StringBuilder where = new StringBuilder("WHERE 1=1 ");
        AdminUserListFilters.appendAccountKind(where, "users");
        AdminUserListFilters.appendActiveKind(where, "active");
        String sql = where.toString();
        assertTrue(sql.contains("u.users_id IS NOT NULL"));
        assertTrue(sql.contains("u.active = 1"));
    }
}
