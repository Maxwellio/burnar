package burnar.naryad.global.service;

import org.junit.jupiter.api.Test;

import java.math.BigDecimal;
import java.sql.Timestamp;
import java.time.LocalDateTime;
import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;

/** Правила окна общих параметров без обращения к базе. */
class NaryadGlobalParamsTest {

    @Test
    void locationRowsStayReadOnlyUntilWellSearch() {
        assertFalse(NaryadGlobalParams.referenceEditable(false, new BigDecimal("149")));
        assertFalse(NaryadGlobalParams.valueEditable(false, new BigDecimal("5")));
        assertFalse(NaryadGlobalParams.valueEditable(false, new BigDecimal("470")));
        assertTrue(NaryadGlobalParams.referenceEditable(false, new BigDecimal("501")));
        assertTrue(NaryadGlobalParams.valueEditable(false, new BigDecimal("501")));
    }

    @Test
    void closedNaryadLocksHeaderAndTable() {
        assertTrue(NaryadGlobalParams.headerLocked(true));
        assertFalse(NaryadGlobalParams.referenceEditable(true, new BigDecimal("501")));
        assertFalse(NaryadGlobalParams.valueEditable(true, new BigDecimal("149")));
        assertFalse(NaryadGlobalParams.headerLocked(false));
    }

    @Test
    void eitherClosedPartLocksTheForm() {
        assertTrue(NaryadGlobalParams.closed(1, 0));
        assertTrue(NaryadGlobalParams.closed(0, 1));
        assertTrue(NaryadGlobalParams.closed(null, 1));
        assertFalse(NaryadGlobalParams.closed(0, null));
    }

    @Test
    void blankTextBecomesNullAndLengthIsChecked() {
        assertNull(NaryadGlobalParams.normalizeShifr("  "));
        assertEquals("A-1", NaryadGlobalParams.normalizeShifr(" A-1 "));
        assertEquals("Наряд", NaryadGlobalParams.normalizeNm("Наряд"));
        assertThrows(org.springframework.web.server.ResponseStatusException.class,
                () -> NaryadGlobalParams.normalizeShifr("123456789012345678901"));
        assertThrows(org.springframework.web.server.ResponseStatusException.class,
                () -> NaryadGlobalParams.normalizeNm("н".repeat(51)));
    }

    @Test
    void zeroNumericValueIsStoredAsNull() {
        assertNull(NaryadGlobalParams.normalizeVal(BigDecimal.ZERO));
        assertNull(NaryadGlobalParams.normalizeVal(new BigDecimal("0.0004")));
        assertEquals(new BigDecimal("1.250"), NaryadGlobalParams.normalizeVal(new BigDecimal("1.25")));
        assertThrows(org.springframework.web.server.ResponseStatusException.class,
                () -> NaryadGlobalParams.normalizeVal(new BigDecimal("1000000")));
    }

    @Test
    void createdateShowsSeconds() {
        Timestamp ts = Timestamp.valueOf(LocalDateTime.of(2026, 3, 4, 9, 8, 7));
        assertEquals("04.03.2026 09:08:07", NaryadGlobalParams.formatCreatedate(ts));
        assertNull(NaryadGlobalParams.formatCreatedate(null));
    }

    @Test
    void headerChangeIgnoresUnchangedFields() {
        assertFalse(NaryadGlobalParams.headerChanged(10, "ш", "имя", 10, "ш", "имя"));
        assertTrue(NaryadGlobalParams.headerChanged(10, "ш", "имя", 11, "ш", "имя"));
        assertFalse(NaryadGlobalParams.headerChanged(10, null, "имя", 10, "", "имя"));
        assertFalse(NaryadGlobalParams.headerChanged(10, "  ш ", "имя", 10, "ш", "имя"));
    }

    @Test
    void checkListsDifferByMembership() {
        assertTrue(NaryadGlobalParams.sameIds(List.of(2, 1), List.of(1, 2)));
        assertFalse(NaryadGlobalParams.sameIds(List.of(1), List.of()));
        assertTrue(NaryadGlobalParams.sameIds(null, List.of()));
    }
}
