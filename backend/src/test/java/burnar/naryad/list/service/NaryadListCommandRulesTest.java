package burnar.naryad.list.service;

import burnar.naryad.skv.service.NaryadSkvParams;

import org.junit.jupiter.api.Test;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDateTime;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertThrows;

class NaryadListCommandRulesTest {

    @Test
    void blankNameIsOmittedAndFilledNameIsTrimmed() {
        assertNull(NaryadListCommandRules.optionalName(null));
        assertNull(NaryadListCommandRules.optionalName("   "));
        assertEquals("Скважина 12", NaryadListCommandRules.optionalName("  Скважина 12  "));
    }

    @Test
    void nameLongerThanDefnarColumnIsRejected() {
        ResponseStatusException error = assertThrows(
                ResponseStatusException.class,
                () -> NaryadListCommandRules.optionalName("я".repeat(51)));
        assertEquals(400, error.getStatus().value());
        assertEquals(NaryadListCommandRules.NAME_TOO_LONG, error.getReason());
    }

    @Test
    void blankBeginDateIsOmittedAndAFilledDateKeepsSeconds() {
        assertNull(NaryadListCommandRules.optionalBegDate(null));
        assertNull(NaryadListCommandRules.optionalBegDate("  "));
        assertEquals(
                LocalDateTime.of(2026, 11, 18, 8, 30, 15),
                NaryadListCommandRules.optionalBegDate("2026-11-18T08:30:15"));
    }

    @Test
    void invalidBeginDateIsRejectedBeforeCreate() {
        ResponseStatusException error = assertThrows(
                ResponseStatusException.class,
                () -> NaryadListCommandRules.optionalBegDate("18.11.2026"));
        assertEquals(400, error.getStatus().value());
        assertEquals(NaryadSkvParams.BEG_DATE_INVALID, error.getReason());
    }

    @Test
    void closedZadanieBlocksDelete() {
        assertEquals(
                NaryadListCommandRules.ZADANIE_CLOSED,
                NaryadListCommandRules.deleteRefusal(true, false));
    }

    @Test
    void closedVipolnenieBlocksDelete() {
        assertEquals(
                NaryadListCommandRules.VIPOLNENIE_CLOSED,
                NaryadListCommandRules.deleteRefusal(false, true));
    }

    @Test
    void openPartsAndMissingDescriptorsAllowDelete() {
        assertNull(NaryadListCommandRules.deleteRefusal(false, false));
        assertNull(NaryadListCommandRules.deleteRefusal(null, null));
        assertNull(NaryadListCommandRules.deleteRefusal(false, null));
    }

    @Test
    void bothClosedReportsTheZadanieFirst() {
        assertEquals(
                NaryadListCommandRules.ZADANIE_CLOSED,
                NaryadListCommandRules.deleteRefusal(true, true));
    }
}
