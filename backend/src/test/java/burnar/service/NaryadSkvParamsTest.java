package burnar.service;

import org.junit.jupiter.api.Test;

import java.sql.Timestamp;
import java.time.LocalDateTime;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertTrue;

/** Дата начала и дата закрытия сквозных параметров хранят секунды. */
class NaryadSkvParamsTest {

    @Test
    void begDateKeepsSecondsAndDropsNanos() {
        Timestamp ts = Timestamp.valueOf(LocalDateTime.of(2026, 10, 19, 8, 30, 15, 123_000_000));
        assertEquals("2026-10-19T08:30:15", NaryadSkvParams.formatBegDate(ts));
        assertEquals(
                LocalDateTime.of(2026, 10, 19, 8, 30, 15),
                NaryadSkvParams.parseBegDate("2026-10-19T08:30:15.900"));
        assertTrue(NaryadSkvParams.sameBegDate(ts, LocalDateTime.of(2026, 10, 19, 8, 30, 15, 999)));
        assertFalse(NaryadSkvParams.sameBegDate(ts, LocalDateTime.of(2026, 10, 19, 8, 30, 16)));
    }

    @Test
    void closedDateShowsSeconds() {
        Timestamp ts = Timestamp.valueOf(LocalDateTime.of(2026, 10, 19, 8, 30, 15));
        assertEquals("19.10.2026 08:30:15", NaryadSkvParams.formatClosedDate(ts));
        assertNull(NaryadSkvParams.formatClosedDate(null));
        assertNull(NaryadSkvParams.formatBegDate(null));
    }
}
