package burnar.service;

import burnar.dto.NaryadMasterDto;
import org.junit.jupiter.api.Test;

import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;

/**
 * Разбор json_agg мастеров: пусто / один / несколько / битый JSON.
 */
class NaryadMastersJsonTest {

    @Test
    void blankAndEmptyArrayAreEmpty() {
        assertTrue(NaryadListService.parseMastersJson(null).isEmpty());
        assertTrue(NaryadListService.parseMastersJson("").isEmpty());
        assertTrue(NaryadListService.parseMastersJson("   ").isEmpty());
        assertTrue(NaryadListService.parseMastersJson("[]").isEmpty());
    }

    @Test
    void singleMaster() {
        List<NaryadMasterDto> list = NaryadListService.parseMastersJson(
                "[{\"id\":1042,\"fio\":\"Иванов И.И.\"}]");
        assertEquals(1, list.size());
        assertEquals(1042, list.get(0).getId());
        assertEquals("Иванов И.И.", list.get(0).getFio());
    }

    @Test
    void severalMastersKeepOrder() {
        List<NaryadMasterDto> list = NaryadListService.parseMastersJson(
                "[{\"id\":1042,\"fio\":\"Иванов И.И.\"},{\"id\":218,\"fio\":\"Петров П.П.\"}]");
        assertEquals(2, list.size());
        assertEquals(1042, list.get(0).getId());
        assertEquals("Иванов И.И.", list.get(0).getFio());
        assertEquals(218, list.get(1).getId());
        assertEquals("Петров П.П.", list.get(1).getFio());
    }

    @Test
    void invalidJsonIsEmpty() {
        assertTrue(NaryadListService.parseMastersJson("{not-json}").isEmpty());
        assertTrue(NaryadListService.parseMastersJson("null").isEmpty());
    }
}

/**
 * Контракт SQL: выборка несёт people.id, фильтр колонки — только getmasters (ФИО).
 */
class NaryadMasterSqlContractTest {

    @Test
    void selectAggregatesPeopleIdAndFioreports() {
        String sql = NaryadListService.MASTERS_JSON_SQL;
        assertTrue(sql.contains("p.id"), sql);
        assertTrue(sql.contains("p.fioreports"), sql);
        assertTrue(sql.contains("json_agg"), sql);
        assertTrue(sql.contains("json_build_object"), sql);
    }

    @Test
    void columnFilterStaysOnGetmastersNames() {
        String filter = NaryadListService.MASTER_NAME_FILTER_SQL;
        assertTrue(filter.contains("burnar.getmasters"), filter);
        assertTrue(filter.contains(":masterNar"), filter);
        assertFalse(filter.contains("p.id"), filter);
        assertFalse(filter.contains("people.id"), filter);
    }
}
