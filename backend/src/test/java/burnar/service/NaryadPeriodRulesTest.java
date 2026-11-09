package burnar.service;

import org.junit.jupiter.api.Test;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDateTime;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;

class NaryadPeriodRulesTest {

    @Test
    void nameIsTrimmedAndLimitedToTheColumn() {
        assertEquals("Январь", NaryadPeriodRules.requireName("  Январь  "));
        assertEquals("Укажите название периода", errorOf(() -> NaryadPeriodRules.requireName("  ")));
        assertEquals(
                "Название периода не длиннее 128 символов",
                errorOf(() -> NaryadPeriodRules.requireName("я".repeat(129))));
    }

    @Test
    void bothTimestampsAreRequiredAndTheEndIsNotEarlier() {
        LocalDateTime begin = LocalDateTime.of(2026, 1, 1, 8, 0, 0);
        LocalDateTime end = LocalDateTime.of(2026, 1, 1, 8, 0, 0);
        assertEquals(begin, NaryadPeriodRules.requireStamp("2026-01-01T08:00:00"));
        assertEquals("Укажите дату и время начала и окончания", errorOf(() -> NaryadPeriodRules.requireStamp(" ")));
        assertEquals("Укажите дату и время начала и окончания", errorOf(() -> NaryadPeriodRules.requireStamp("01.01.2026")));
        NaryadPeriodRules.requireOrder(begin, end);
        assertEquals(
                "Окончание не может быть раньше начала",
                errorOf(() -> NaryadPeriodRules.requireOrder(end.plusSeconds(1), end)));
    }

    @Test
    void stampRoundTripKeepsSeconds() {
        assertEquals("2026-01-31T18:00:00", NaryadPeriodRules.format(LocalDateTime.of(2026, 1, 31, 18, 0)));
    }

    private static String errorOf(Runnable action) {
        ResponseStatusException error = assertThrows(ResponseStatusException.class, action::run);
        return error.getReason();
    }
}
