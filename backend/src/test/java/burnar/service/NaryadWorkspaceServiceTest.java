package burnar.service;

import org.junit.jupiter.api.Test;

import java.sql.Timestamp;
import java.time.LocalDateTime;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertTrue;

/**
 * Правила карточки: дата как в Delphi, параметры только для 79/80, алгоритм только для 80,
 * SQL деревьев/параметров как qrNarZad / qrNarVip / qrParamZ / qrParamV / qrAlgInfo.
 */
class NaryadWorkspaceServiceTest {

    @Test
    void midnightBegoperdateIsDateOnly() {
        Timestamp ts = Timestamp.valueOf(LocalDateTime.of(2024, 3, 5, 0, 0, 0));
        assertEquals("05.03.2024", NaryadWorkspaceService.formatBegoperdate(ts));
    }

    @Test
    void begoperdateWithTimeKeepsHoursAndMinutes() {
        Timestamp ts = Timestamp.valueOf(LocalDateTime.of(2024, 3, 5, 14, 7, 30));
        assertEquals("05.03.2024 14:07", NaryadWorkspaceService.formatBegoperdate(ts));
    }

    @Test
    void nullBegoperdateStaysNull() {
        assertNull(NaryadWorkspaceService.formatBegoperdate(null));
    }

    @Test
    void paramsOnlyForCombinationAndAlgorithm() {
        assertTrue(NaryadWorkspaceService.loadsParams(79));
        assertTrue(NaryadWorkspaceService.loadsParams(80));
        assertFalse(NaryadWorkspaceService.loadsParams(78));
        assertFalse(NaryadWorkspaceService.loadsParams(82));
        assertFalse(NaryadWorkspaceService.loadsParams(81));
        assertFalse(NaryadWorkspaceService.loadsParams(null));
    }

    @Test
    void algorithmOnlyForOperlifetype80() {
        assertTrue(NaryadWorkspaceService.loadsAlgorithm(80));
        assertFalse(NaryadWorkspaceService.loadsAlgorithm(79));
        assertFalse(NaryadWorkspaceService.loadsAlgorithm(null));
    }

    @Test
    void zadanieTreeSqlMatchesDelphiQrNarZad() {
        String sql = NaryadWorkspaceService.ZADANIE_TREE_SQL;
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
        String sql = NaryadWorkspaceService.VIPOLNENIE_TREE_SQL;
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
    void zadanieParamsSqlMatchesQrParamZ() {
        String sql = NaryadWorkspaceService.ZADANIE_PARAMS_SQL;
        assertTrue(sql.contains("burnar.zadanie_param"), sql);
        assertTrue(sql.contains("burnar.zndefnarzadatrib"), sql);
        assertTrue(sql.contains("public.user_param"), sql);
        assertTrue(sql.contains("public.zn_dparam"), sql);
        assertTrue(sql.contains("public.comboperparam"), sql);
        assertTrue(sql.contains(":zadkey"), sql);
        assertTrue(sql.contains(":aoperlifeid"), sql);
    }

    @Test
    void vipolnenieParamsSqlMatchesQrParamV() {
        String sql = NaryadWorkspaceService.VIPOLNENIE_PARAMS_SQL;
        assertTrue(sql.contains("burnar.vipolnenie_param"), sql);
        assertTrue(sql.contains("burnar.zndefnarvipatrib"), sql);
        assertTrue(sql.contains(":vipkey"), sql);
    }

    @Test
    void algorithmSqlMatchesQrAlgInfo() {
        String sql = NaryadWorkspaceService.ALGORITHM_SQL;
        assertTrue(sql.contains("public.algs"), sql);
        assertTrue(sql.contains("public.alg_operlife"), sql);
        assertTrue(sql.contains("public.operlife"), sql);
        assertTrue(sql.contains(":oplife"), sql);
    }

    @Test
    void treeLevelWhereRootsAndChildren() {
        assertTrue(NaryadWorkspaceService.TREE_ROOTS_WHERE.contains("parent IS NULL"));
        assertTrue(NaryadWorkspaceService.TREE_CHILDREN_WHERE.contains(":parentId"));
    }
}
