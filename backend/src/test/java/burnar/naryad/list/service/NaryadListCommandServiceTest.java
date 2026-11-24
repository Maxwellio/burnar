package burnar.naryad.list.service;

import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;

class NaryadListCommandServiceTest {

    @Test
    void createCallsCreatenarForDrillingAndWritesOnlyPassedFields() {
        assertEquals(1, NaryadListCommandService.DRILLING_NARTYPE);
        assertTrue(NaryadListCommandService.CREATE_SQL.contains("CALL burnar.createnar"));
        assertTrue(NaryadListCommandService.UPDATE_NAME_SQL.contains("UPDATE burnar.defnar"));
        assertTrue(NaryadListCommandService.UPDATE_NAME_SQL.contains("nm = :nm"));
        assertTrue(NaryadListCommandService.UPDATE_BEGDATE_SQL.contains("UPDATE burnar.defnarzad"));
        assertTrue(NaryadListCommandService.UPDATE_BEGDATE_SQL.contains("begdate = :begdate"));
        assertTrue(NaryadListCommandService.SET_DATE_SQL.contains("CALL burnar.zadanie_set_date"));
    }

    @Test
    void brigadeListIsSprWorkersPathLimitedBySysbossSubtree() {
        String sql = NaryadListCommandService.CREATE_BRIGADES_SQL;
        assertTrue(sql.contains("burnar.spr_workers"), sql);
        assertTrue(sql.contains("t.key"), sql);
        assertTrue(sql.contains("o.parent = 0"), sql);
        assertTrue(sql.contains("c.sysboss = tr.id"), sql);
        assertFalse(sql.contains("burnar.defnar"), sql);
        String admin = NaryadListCommandService.ADMIN_CREATE_BRIGADES_SQL;
        assertTrue(admin.contains("burnar.spr_workers"), admin);
        assertFalse(admin.contains("sysboss"), admin);
        assertFalse(admin.contains("burnar.defnar"), admin);
    }

    @Test
    void deleteFollowsDelphiOrderInsideOneNaryad() {
        String sql = String.join("\n", NaryadListCommandService.DELETE_SQL);
        int period = sql.indexOf("DELETE FROM burnar.vipolnenie_period");
        int zadanie = sql.indexOf("DELETE FROM burnar.zadanie_oper");
        int vipolnenie = sql.indexOf("DELETE FROM burnar.vipolnenie_oper");
        int defnar = sql.indexOf("DELETE FROM burnar.defnar");
        assertTrue(period >= 0 && zadanie > period && vipolnenie > zadanie && defnar > vipolnenie, sql);
        assertTrue(sql.contains("narkey = :id"), sql);
        assertTrue(sql.contains("key = :id"), sql);
    }
}
