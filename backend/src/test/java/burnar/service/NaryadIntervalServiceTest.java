package burnar.service;

import org.junit.jupiter.api.Test;

import java.math.BigDecimal;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertTrue;

class NaryadIntervalServiceTest {

    @Test
    void mehburQueryMatchesTheDelphiGrid() {
        String sql = NaryadIntervalService.MEH_SQL.toLowerCase();
        assertTrue(sql.contains("burnar.getrabmehburintervals(d.key, vo.key)"), sql);
        assertTrue(sql.contains("vo.operlifetypeoper = 203"), sql);
        assertTrue(sql.contains("vp.parcode in (747, 748)"), sql);
        assertTrue(sql.contains("d.key = :narkey"), sql);
        assertTrue(sql.contains("group by d.key, vo.key, vo.prnum"), sql);
        assertTrue(sql.contains("order by ot, vo.prnum"), sql);
        assertTrue(sql.contains("public.spr_oper"), sql);
    }

    @Test
    void narashchivanieUsesTheAlternateIntervalParameters() {
        String sql = NaryadIntervalService.NAR_SQL.toLowerCase();
        assertTrue(sql.contains("burnar.getrabnarintervals(d.key, vo.key)"), sql);
        assertTrue(sql.contains("vo.operlifetypeoper = 213"), sql);
        assertTrue(sql.contains("747, 748, 1073, 1074"), sql);
        assertTrue(sql.contains("vp.parcode = 1073"), sql);
        assertTrue(sql.contains("vp.parcode = 1074"), sql);
        assertTrue(sql.contains("order by ot, vo.prnum"), sql);
    }

    @Test
    void colorCodeKeepsTheDelphiHighlightAndDropsABlankValue() {
        assertEquals(8454143, NaryadIntervalService.colorCode("8454143"));
        assertEquals(0, NaryadIntervalService.colorCode(new BigDecimal("0")));
        assertNull(NaryadIntervalService.colorCode("  "));
        assertNull(NaryadIntervalService.colorCode("нет"));
    }
}
