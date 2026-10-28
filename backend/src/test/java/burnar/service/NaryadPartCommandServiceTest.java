package burnar.service;

import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;

class NaryadPartCommandServiceTest {

    @Test
    void vipolnenieLockFlagsStayInsideTheNaryad() {
        String sql = NaryadPartCommandService.VIPOLNENIE_LOCK_FLAGS_SQL;
        assertTrue(sql.contains("SELECT o.key, o.locked"), sql);
        assertTrue(sql.contains("burnar.vipolnenie_oper"), sql);
        assertTrue(sql.contains("narkey = :narkey"), sql);
        assertFalse(sql.contains("nodeIds"), sql);
    }
}
