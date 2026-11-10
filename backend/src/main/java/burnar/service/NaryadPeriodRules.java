package burnar.service;

import org.springframework.http.HttpStatus;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.time.format.DateTimeParseException;

/**
 * Название и границы периода без обращения к базе.
 * Колонка {@code vipolnenie_period.nm} — varchar(128).
 */
public final class NaryadPeriodRules {

    static final int NAME_MAX = 128;
    static final String NAME_REQUIRED = "Укажите название периода";
    static final String NAME_TOO_LONG = "Название периода не длиннее 128 символов";
    static final String DATES_REQUIRED = "Укажите дату и время начала и окончания";
    static final String END_BEFORE_BEGIN = "Окончание не может быть раньше начала";

    private static final DateTimeFormatter STAMP = DateTimeFormatter.ofPattern("yyyy-MM-dd'T'HH:mm:ss");

    private NaryadPeriodRules() {
    }

    static String requireName(String nm) {
        String name = nm == null ? "" : nm.trim();
        if (name.isEmpty()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, NAME_REQUIRED);
        }
        if (name.length() > NAME_MAX) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, NAME_TOO_LONG);
        }
        return name;
    }

    static LocalDateTime requireStamp(String value) {
        if (value == null || value.isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, DATES_REQUIRED);
        }
        try {
            return LocalDateTime.parse(value.trim(), STAMP);
        } catch (DateTimeParseException ex) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, DATES_REQUIRED);
        }
    }

    static void requireOrder(LocalDateTime begin, LocalDateTime end) {
        if (end.isBefore(begin)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, END_BEFORE_BEGIN);
        }
    }

    static String format(LocalDateTime value) {
        return value.format(STAMP);
    }
}
