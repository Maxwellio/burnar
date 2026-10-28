package burnar.service;

import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.assertTrue;

class NaryadRowColorServiceTest {

    @Test
    void zadanieColorUpdateIsScopedToNaryadAndNode() {
        String sql = NaryadRowColorService.UPDATE_ZADANIE_COLOR_SQL;
        assertTrue(sql.contains("UPDATE burnar.zadanie_oper"), sql);
        assertTrue(sql.contains("SET colorsel = :color"), sql);
        assertTrue(sql.contains("narkey = :narkey"), sql);
        assertTrue(sql.contains("key = :nodeId"), sql);
    }

    @Test
    void vipolnenieColorUpdateIsScopedToNaryadAndNode() {
        String sql = NaryadRowColorService.UPDATE_VIPOLNENIE_COLOR_SQL;
        assertTrue(sql.contains("UPDATE burnar.vipolnenie_oper"), sql);
        assertTrue(sql.contains("SET colorsel = :color"), sql);
        assertTrue(sql.contains("narkey = :narkey"), sql);
        assertTrue(sql.contains("key = :nodeId"), sql);
    }

    @Test
    void batchColorUpdatesAreScopedToTheNaryadAndRequestedNodes() {
        String zadanie = NaryadRowColorService.UPDATE_ZADANIE_COLORS_SQL;
        assertTrue(zadanie.contains("UPDATE burnar.zadanie_oper"), zadanie);
        assertTrue(zadanie.contains("SET colorsel = :color"), zadanie);
        assertTrue(zadanie.contains("narkey = :narkey"), zadanie);
        assertTrue(zadanie.contains("key IN (:nodeIds)"), zadanie);

        String vipolnenie = NaryadRowColorService.UPDATE_VIPOLNENIE_COLORS_SQL;
        assertTrue(vipolnenie.contains("UPDATE burnar.vipolnenie_oper"), vipolnenie);
        assertTrue(vipolnenie.contains("key IN (:nodeIds)"), vipolnenie);
    }
}
