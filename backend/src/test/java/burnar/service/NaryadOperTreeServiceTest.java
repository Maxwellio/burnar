package burnar.service;

import org.junit.jupiter.api.Test;

import java.math.BigDecimal;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
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
    void periodTotalsSqlMatchesDelphiQrItogTable() {
        String sql = NaryadOperTreeService.VIPOLNENIE_PERIOD_TOTALS_SQL.toLowerCase();
        assertTrue(sql.contains("burnar.vipolnenie_oper"), sql);
        assertTrue(sql.contains("burnar.vipolnenie_norm"), sql);
        assertTrue(sql.contains("burnar.vipolnenie_period"), sql);
        assertTrue(sql.contains("burnar.znrepparsv"), sql);
        assertTrue(sql.contains("n.prnum = 2"), sql);
        assertTrue(sql.contains("f.parcode = 2683"), sql);
        assertTrue(sql.contains("f.repid = 1"), sql);
        assertTrue(sql.contains("0.053"), sql);
        assertTrue(sql.contains("not in (200, 207, 208, 209)"), sql);
        assertTrue(sql.contains("не включенные в периоды работы"), sql);
        assertTrue(sql.contains("f.period_key = o.period"), sql);
        assertTrue(sql.contains("f.period_key = p.key"), sql);
        assertTrue(sql.contains("> sum(round("), sql);
        assertTrue(sql.contains("coalesce(vv.normativ, 0) + coalesce(vv.remont_n, 0) as summ_n"), sql);
        assertTrue(sql.contains("coalesce(vv.fact, 0) + coalesce(vv.remont_f, 0) as summ_f"), sql);
        assertTrue(sql.contains("coalesce(vv.normativ, 0) as normativ"), sql);
        assertTrue(sql.contains("coalesce(vv.remont_n, 0) as remont_n"), sql);
        assertTrue(sql.contains("coalesce(vv.fact, 0) as fact"), sql);
        assertTrue(sql.contains("coalesce(vv.remont_f, 0) as remont_f"), sql);
        assertTrue(sql.contains("coalesce(sum(round(n.norma / 60, 2)), 0) as normativ"), sql);
        assertTrue(sql.contains("coalesce(sum(round(n.fact / 60, 2)), 0) as fact"), sql);
        assertTrue(sql.contains(
                "coalesce((select coalesce(f.val, 0) from burnar.znrepparsv f "
                        + "where f.parcode = 2683 and f.period_key = p.key and f.repid = 1), 0) as remont_f"),
                sql);
        assertFalse(sql.contains("vv.fact + vv.remont_f"), sql);
        assertFalse(sql.contains("f.prnum"), sql);
        assertFalse(sql.contains("f.defnar"), sql);
    }

    @Test
    void missingPeriodTotalHoursBecomeZero() {
        assertEquals(0, BigDecimal.ZERO.compareTo(NaryadOperTreeService.hoursOrZero(null)));
        assertEquals(0, new BigDecimal("1.25").compareTo(NaryadOperTreeService.hoursOrZero(new BigDecimal("1.25"))));
    }

    @Test
    void workRowsStayInsideTheRequestedNodes() {
        assertTrue(NaryadOperTreeService.ZADANIE_WORK_ROWS_SQL.contains("burnar.zadanie_oper"));
        assertTrue(NaryadOperTreeService.VIPOLNENIE_WORK_ROWS_SQL.contains("burnar.vipolnenie_oper"));
        assertTrue(NaryadOperTreeService.ZADANIE_WORK_ROWS_SQL.contains("key IN (:nodeIds)"));
    }
}
