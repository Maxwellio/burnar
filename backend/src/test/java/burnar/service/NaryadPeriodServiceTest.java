package burnar.service;

import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;

class NaryadPeriodServiceTest {

    @Test
    void periodsAreListedForOneNaryadInDelphiOrder() {
        String sql = NaryadPeriodService.LIST_SQL;
        assertTrue(sql.contains("FROM burnar.vipolnenie_period"), sql);
        assertTrue(sql.contains("narkey = :narkey"), sql);
        assertTrue(sql.contains("ORDER BY t.begoperdate, t.outoperdate"), sql);
        assertFalse(sql.contains("nodeIds"), sql);
    }

    @Test
    void insertLeavesTheKeyToTheBeforeInsertTriggerAndStoresTheAuthor() {
        String sql = NaryadPeriodService.INSERT_SQL;
        assertTrue(sql.contains(
                "INSERT INTO burnar.vipolnenie_period (user_id, narkey, nm, begoperdate, outoperdate)"), sql);
        assertTrue(sql.contains("RETURNING key"), sql);
        assertFalse(sql.contains("(key"), sql);
    }

    @Test
    void updateAndDeleteStayInsideTheNaryad() {
        String update = NaryadPeriodService.UPDATE_SQL;
        assertTrue(update.contains("UPDATE burnar.vipolnenie_period"), update);
        assertTrue(update.contains("key = :key"), update);
        assertTrue(update.contains("narkey = :narkey"), update);

        String delete = NaryadPeriodService.DELETE_SQL;
        assertTrue(delete.contains("DELETE FROM burnar.vipolnenie_period"), delete);
        assertTrue(delete.contains("key = :key"), delete);
        assertTrue(delete.contains("narkey = :narkey"), delete);
    }

    @Test
    void bindWritesOnlyTheRequestedRowsOfThisNaryad() {
        String sql = NaryadPeriodService.BIND_SQL;
        assertTrue(sql.contains("UPDATE burnar.vipolnenie_oper"), sql);
        assertTrue(sql.contains("SET period = :periodKey"), sql);
        assertTrue(sql.contains("narkey = :narkey"), sql);
        assertTrue(sql.contains("key IN (:nodeIds)"), sql);
        assertFalse(sql.contains("parent"), sql);
    }
}
