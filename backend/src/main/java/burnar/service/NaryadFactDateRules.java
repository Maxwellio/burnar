package burnar.service;

import org.springframework.http.HttpStatus;
import org.springframework.web.server.ResponseStatusException;

import java.sql.Timestamp;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.time.format.DateTimeParseException;

/**
 * Ручная дата начала работы. В дереве полночь показывается без времени,
 * в диалог уходит полный штамп, чтобы 00:00:00 не подменялось текущим моментом.
 */
public final class NaryadFactDateRules {

    static final String DATE_REQUIRED = "Укажите дату и время начала работы";

    private static final DateTimeFormatter STAMP = DateTimeFormatter.ofPattern("yyyy-MM-dd'T'HH:mm:ss");

    private NaryadFactDateRules() {
    }

    static LocalDateTime requireStamp(String value) {
        if (value == null || value.isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, DATE_REQUIRED);
        }
        try {
            return LocalDateTime.parse(value.trim(), STAMP);
        } catch (DateTimeParseException ex) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, DATE_REQUIRED);
        }
    }

    static String formatIso(LocalDateTime value) {
        return value.format(STAMP);
    }

    static String formatIso(Timestamp value) {
        if (value == null) {
            return null;
        }
        return formatIso(value.toLocalDateTime());
    }
}
