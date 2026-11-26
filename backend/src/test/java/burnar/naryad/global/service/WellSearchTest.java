package burnar.naryad.global.service;

import org.junit.jupiter.api.Test;
import org.springframework.web.server.ResponseStatusException;

import java.math.BigDecimal;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;

/** Правила поиска скважины без обращения к базе. */
class WellSearchTest {

    @Test
    void emptyFieldsAddNoPatterns() {
        WellSearch.Filters filters = WellSearch.filters(null, "  ", "", null);
        assertNull(filters.skvPrefix());
        assertNull(filters.mestContains());
        assertNull(filters.kustPrefix());
        assertNull(filters.tehmestoPrefix());
    }

    @Test
    void patternsFollowDelphiAndEscapeLikeWildcards() {
        WellSearch.Filters filters = WellSearch.filters("10%_", "%м", "к_1", "12345");
        assertEquals("10\\%\\_%", filters.skvPrefix());
        assertEquals("%\\%м%", filters.mestContains());
        assertEquals("к\\_1%", filters.kustPrefix());
        assertEquals("12345%", filters.tehmestoPrefix());
    }

    @Test
    void techPlaceShorterThanFiveCharactersIsNotASearchFilter() {
        assertNull(WellSearch.filters(null, null, null, "1234").tehmestoPrefix());
        assertEquals("12345%", WellSearch.filters(null, null, null, "12345").tehmestoPrefix());
    }

    @Test
    void refreshRequiresNineCharacters() {
        ResponseStatusException ex = assertThrows(
                ResponseStatusException.class, () -> WellSearch.refreshTehmesto("12345678"));
        assertEquals(WellSearch.REFRESH_TOO_SHORT, ex.getReason());
        assertTrue(ex.getReason().contains("не менее 9 символов"));
        assertEquals("123456789", WellSearch.refreshTehmesto("123456789"));
    }

    @Test
    void searchSqlKeepsOnlyTheActiveFilters() {
        String sql = WellSearch.searchSql(WellSearch.filters("15", null, null, "1234"));
        assertTrue(sql.contains("s.parent_id = 149"));
        assertTrue(sql.contains("s.parent_id = 470"));
        assertTrue(sql.contains("s.parent_id = 5"));
        assertTrue(sql.contains("c.id = 3015"));
        assertTrue(sql.contains("o.atribname = 'Key MDM'"));
        assertTrue(sql.contains("LIKE lower(:skv)"));
        assertTrue(!sql.contains(":mest"));
        assertTrue(!sql.contains(":kust"));
        assertTrue(!sql.contains(":tehmesto"));
        assertTrue(sql.contains("ORDER BY m.nm_msr, k.nm_kust, sk.nm_skv"));
    }
}
