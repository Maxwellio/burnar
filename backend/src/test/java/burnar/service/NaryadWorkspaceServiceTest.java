package burnar.service;

import org.junit.jupiter.api.Test;
import org.springframework.web.server.ResponseStatusException;

import java.sql.Timestamp;
import java.time.LocalDateTime;
import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
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

    @Test
    void colorMustBeWithinRgbRange() {
        assertEquals(0, NaryadWorkspaceService.requireValidColor(0));
        assertEquals(0xFFFFFF, NaryadWorkspaceService.requireValidColor(0xFFFFFF));
        assertThrows(ResponseStatusException.class,
                () -> NaryadWorkspaceService.requireValidColor(-1));
        assertThrows(ResponseStatusException.class,
                () -> NaryadWorkspaceService.requireValidColor(0x1000000));
        assertThrows(ResponseStatusException.class,
                () -> NaryadWorkspaceService.requireValidColor(null));
    }

    @Test
    void zadanieColorUpdateIsScopedToNaryadAndNode() {
        String sql = NaryadWorkspaceService.UPDATE_ZADANIE_COLOR_SQL;
        assertTrue(sql.contains("UPDATE burnar.zadanie_oper"), sql);
        assertTrue(sql.contains("SET colorsel = :color"), sql);
        assertTrue(sql.contains("narkey = :narkey"), sql);
        assertTrue(sql.contains("key = :nodeId"), sql);
    }

    @Test
    void vipolnenieColorUpdateIsScopedToNaryadAndNode() {
        String sql = NaryadWorkspaceService.UPDATE_VIPOLNENIE_COLOR_SQL;
        assertTrue(sql.contains("UPDATE burnar.vipolnenie_oper"), sql);
        assertTrue(sql.contains("SET colorsel = :color"), sql);
        assertTrue(sql.contains("narkey = :narkey"), sql);
        assertTrue(sql.contains("key = :nodeId"), sql);
    }

    @Test
    void zadanieDescriptorIsLockedBeforeColorUpdate() {
        String sql = NaryadWorkspaceService.ZADANIE_DESCRIPTOR_SQL;
        assertTrue(sql.contains("FOR UPDATE"), sql);
    }

    @Test
    void vipolnenieDescriptorIsLockedBeforeColorUpdate() {
        String sql = NaryadWorkspaceService.VIPOLNENIE_DESCRIPTOR_SQL;
        assertTrue(sql.contains("FOR UPDATE"), sql);
    }

    @Test
    void batchColorUpdatesAreScopedToTheNaryadAndRequestedNodes() {
        String zadanie = NaryadWorkspaceService.UPDATE_ZADANIE_COLORS_SQL;
        assertTrue(zadanie.contains("UPDATE burnar.zadanie_oper"), zadanie);
        assertTrue(zadanie.contains("SET colorsel = :color"), zadanie);
        assertTrue(zadanie.contains("narkey = :narkey"), zadanie);
        assertTrue(zadanie.contains("key IN (:nodeIds)"), zadanie);

        String vipolnenie = NaryadWorkspaceService.UPDATE_VIPOLNENIE_COLORS_SQL;
        assertTrue(vipolnenie.contains("UPDATE burnar.vipolnenie_oper"), vipolnenie);
        assertTrue(vipolnenie.contains("key IN (:nodeIds)"), vipolnenie);
    }

    @Test
    void vipolnenieLockFlagsStayInsideTheNaryad() {
        String sql = NaryadWorkspaceService.VIPOLNENIE_LOCK_FLAGS_SQL;
        assertTrue(sql.contains("SELECT o.key, o.locked"), sql);
        assertTrue(sql.contains("burnar.vipolnenie_oper"), sql);
        assertTrue(sql.contains("narkey = :narkey"), sql);
        assertFalse(sql.contains("nodeIds"), sql);
    }

    @Test
    void workDeleteProceduresMatchDelphiNames() {
        assertTrue(NaryadWorkspaceService.ZADANIE_DELETE_WORK_SQL.contains("burnar.zadanie_operac_del"));
        assertTrue(NaryadWorkspaceService.ZADANIE_DELETE_BLOCK_SQL.contains("burnar.zadanie_operac_del_block"));
        assertTrue(NaryadWorkspaceService.VIPOLNENIE_DELETE_WORK_SQL.contains("burnar.vipolnenie_operac_del"));
        assertTrue(NaryadWorkspaceService.VIPOLNENIE_DELETE_BLOCK_SQL.contains("burnar.vipolnenie_operac_del_block"));
        assertTrue(NaryadWorkspaceService.ZADANIE_WORK_ROWS_SQL.contains("burnar.zadanie_oper"));
        assertTrue(NaryadWorkspaceService.VIPOLNENIE_WORK_ROWS_SQL.contains("burnar.vipolnenie_oper"));
        assertTrue(NaryadWorkspaceService.ZADANIE_WORK_ROWS_SQL.contains("key IN (:nodeIds)"));
    }

    @Test
    void nodeIdsAreRequiredAndDuplicatesCollapseInRequestOrder() {
        assertEquals(List.of(7L, 8L), NaryadWorkspaceService.requireNodeIds(List.of(7L, 7L, 8L)));
        assertThrows(ResponseStatusException.class,
                () -> NaryadWorkspaceService.requireNodeIds(null));
        assertThrows(ResponseStatusException.class,
                () -> NaryadWorkspaceService.requireNodeIds(List.of()));
        assertThrows(ResponseStatusException.class,
                () -> NaryadWorkspaceService.requireNodeIds(java.util.Arrays.asList(7L, null)));
    }
}
