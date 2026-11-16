package burnar.service;

import org.junit.jupiter.api.Test;
import org.springframework.web.server.ResponseStatusException;

import java.sql.Timestamp;
import java.time.LocalDateTime;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertThrows;

class NaryadFactDateRulesTest {

    @Test
    void stampKeepsSecondsAndRejectsABlankValue() {
        LocalDateTime value = LocalDateTime.of(2024, 2, 1, 8, 15, 30);
        assertEquals(value, NaryadFactDateRules.requireStamp("2024-02-01T08:15:30"));
        assertEquals("2024-02-01T08:15:30", NaryadFactDateRules.formatIso(value));
        assertEquals("Укажите дату и время начала работы", errorOf(() -> NaryadFactDateRules.requireStamp(" ")));
        assertEquals("Укажите дату и время начала работы", errorOf(() -> NaryadFactDateRules.requireStamp("01.02.2024")));
    }

    @Test
    void isoKeepsMidnightAndAMissingTimestampStaysEmpty() {
        assertEquals(
                "2024-02-01T00:00:00",
                NaryadFactDateRules.formatIso(Timestamp.valueOf(LocalDateTime.of(2024, 2, 1, 0, 0))));
        assertNull(NaryadFactDateRules.formatIso((Timestamp) null));
    }

    @Test
    void updateWritesOnlyThisRowAndMarksTheDateAsManual() {
        String sql = NaryadFactDateService.UPDATE_SQL;
        assertEquals(true, sql.contains("UPDATE burnar.vipolnenie_oper"));
        assertEquals(true, sql.contains("begoperdate = :begoperdate"));
        assertEquals(true, sql.contains("editdate = 1"));
        assertEquals(true, sql.contains("narkey = :narkey"));
        assertEquals(true, sql.contains("key = :nodeId"));
        assertEquals(true, sql.contains("locked IS NULL OR locked <> 1"));
        assertEquals(false, sql.toLowerCase().contains("setnextdate"));
    }

    private static String errorOf(Runnable action) {
        ResponseStatusException error = assertThrows(ResponseStatusException.class, action::run);
        return error.getReason();
    }
}
