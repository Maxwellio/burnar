package burnar.service;

import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.assertTrue;

class NaryadOperEditServiceTest {

    @Test
    void workDeleteProceduresMatchDelphiNames() {
        assertTrue(NaryadOperEditService.ZADANIE_DELETE_WORK_SQL.contains("burnar.zadanie_operac_del"));
        assertTrue(NaryadOperEditService.ZADANIE_DELETE_BLOCK_SQL.contains("burnar.zadanie_operac_del_block"));
        assertTrue(NaryadOperEditService.VIPOLNENIE_DELETE_WORK_SQL.contains("burnar.vipolnenie_operac_del"));
        assertTrue(NaryadOperEditService.VIPOLNENIE_DELETE_BLOCK_SQL.contains("burnar.vipolnenie_operac_del_block"));
        assertTrue(NaryadOperEditService.ZADANIE_STRUCTURE_SQL.contains("burnar.zadanie_anynm"));
        assertTrue(NaryadOperEditService.VIPOLNENIE_STRUCTURE_SQL.contains("burnar.vipolnenie_anynm"));
        assertTrue(NaryadOperEditService.ZADANIE_RENAME_SQL.contains("UPDATE burnar.zadanie_anynm"));
        assertTrue(NaryadOperEditService.VIPOLNENIE_RENAME_SQL.contains("UPDATE burnar.vipolnenie_anynm"));
    }
}
