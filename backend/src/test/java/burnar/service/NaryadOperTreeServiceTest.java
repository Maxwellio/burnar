package burnar.service;

import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.assertTrue;

class NaryadOperTreeServiceTest {

    @Test
    void zadanieTreeSqlMatchesDelphiQrNarZad() {
        String sql = NaryadOperTreeService.ZADANIE_TREE_SQL;
        assertTrue(sql.contains("burnar.zadanie_oper"), sql);
        assertTrue(sql.contains("burnar.zadanie_GetOperIst"), sql);
        assertTrue(sql.contains("burnar.zadanie_anynm"), sql);
        assertTrue(sql.contains("burnar.zadanie_norm"), sql);
        assertTrue(sql.contains("burnar.ot_params"), sql);
        assertTrue(sql.contains("burnar.do_params"), sql);
        assertTrue(sql.contains("burnar.spr_eks"), sql);
        assertTrue(sql.contains("has_children"), sql);
        assertTrue(sql.contains(":narkey"), sql);
        assertTrue(sql.contains("%s"), sql);
    }

    @Test
    void vipolnenieTreeSqlAddsFactPeriodAndPriznak() {
        String sql = NaryadOperTreeService.VIPOLNENIE_TREE_SQL;
        assertTrue(sql.contains("burnar.vipolnenie_oper"), sql);
        assertTrue(sql.contains("burnar.vipolnenie_GetOperIst"), sql);
        assertTrue(sql.contains("burnar.vipolnenie_norm"), sql);
        assertTrue(sql.contains("burnar.vipolnenie_period"), sql);
        assertTrue(sql.contains("fact"), sql);
        assertTrue(sql.contains("period_nm"), sql);
        assertTrue(sql.contains("priznak"), sql);
        assertTrue(sql.contains("burnar.factkorr"), sql);
    }

    @Test
    void treeLevelWhereRootsAndChildren() {
        assertTrue(NaryadOperTreeService.TREE_ROOTS_WHERE.contains("parent IS NULL"));
        assertTrue(NaryadOperTreeService.TREE_CHILDREN_WHERE.contains(":parentId"));
    }

    @Test
    void workRowsStayInsideTheRequestedNodes() {
        assertTrue(NaryadOperTreeService.ZADANIE_WORK_ROWS_SQL.contains("burnar.zadanie_oper"));
        assertTrue(NaryadOperTreeService.VIPOLNENIE_WORK_ROWS_SQL.contains("burnar.vipolnenie_oper"));
        assertTrue(NaryadOperTreeService.ZADANIE_WORK_ROWS_SQL.contains("key IN (:nodeIds)"));
    }
}
