package burnar.service;

import org.springframework.http.HttpStatus;
import org.springframework.web.server.ResponseStatusException;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.sql.Timestamp;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.time.format.DateTimeParseException;
import java.time.temporal.ChronoUnit;
import java.util.Objects;

/**
 * Правила окна сквозных параметров (Delphi formSkvZadVar / formSkvVipVar) без доступа к базе.
 * Дата начала — до минут, как маска {@code 90.90.2000 !90:00:00}.
 * {@code val} — {@code numeric(8,4)}, {@code valstr} — {@code varchar(150)}.
 */
public final class NaryadSkvParams {

    public static final String CLOSED_MESSAGE = "Наряд закрыт от изменений";
    public static final String LOCKED_MESSAGE = "В выполнении есть заблокированные работы";
    public static final String BEG_DATE_REQUIRED = "Дата и время начала работ не заданы";
    public static final String BEG_DATE_INVALID = "Неверная дата и время начала работ";
    public static final String VAL_OUT_OF_RANGE = "Числовое значение должно быть меньше 10000 по модулю";
    public static final String VALSTR_TOO_LONG = "Строковое значение длиннее 150 символов";
    public static final String VALUE_NOT_IN_LIST = "Значение не входит в справочник параметра";
    public static final String PARAM_NOT_FOUND = "Сквозной параметр не найден";

    static final int VAL_SCALE = 4;
    static final BigDecimal VAL_LIMIT = new BigDecimal("10000");
    static final int VALSTR_MAX = 150;

    private static final DateTimeFormatter ISO_MINUTES = DateTimeFormatter.ofPattern("yyyy-MM-dd'T'HH:mm:ss");
    private static final DateTimeFormatter CLOSED_DATE = DateTimeFormatter.ofPattern("dd.MM.yyyy HH:mm");

    private NaryadSkvParams() {
    }

    /** Задание закрыто; выполнение закрыто или в нём есть заблокированная работа (lLocked). */
    public static String readOnlyReason(boolean closed, long lockedWorks) {
        if (closed) {
            return CLOSED_MESSAGE;
        }
        if (lockedWorks > 0) {
            return LOCKED_MESSAGE;
        }
        return null;
    }

    public static LocalDateTime parseBegDate(String raw) {
        if (raw == null || raw.isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, BEG_DATE_REQUIRED);
        }
        try {
            return LocalDateTime.parse(raw.trim()).truncatedTo(ChronoUnit.MINUTES);
        } catch (DateTimeParseException ex) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, BEG_DATE_INVALID);
        }
    }

    public static String formatBegDate(Timestamp value) {
        return value == null ? null : value.toLocalDateTime().truncatedTo(ChronoUnit.MINUTES).format(ISO_MINUTES);
    }

    public static String formatClosedDate(Timestamp value) {
        return value == null ? null : value.toLocalDateTime().format(CLOSED_DATE);
    }

    public static boolean sameBegDate(Timestamp current, LocalDateTime next) {
        if (current == null) {
            return false;
        }
        return current.toLocalDateTime().truncatedTo(ChronoUnit.MINUTES).equals(next);
    }

    public static BigDecimal normalizeVal(BigDecimal value) {
        if (value == null) {
            return null;
        }
        BigDecimal scaled = value.setScale(VAL_SCALE, RoundingMode.HALF_UP);
        if (scaled.abs().compareTo(VAL_LIMIT) >= 0) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, VAL_OUT_OF_RANGE);
        }
        return scaled;
    }

    /** Пустая строка хранится как NULL, иначе {@code ftrg_log_atrib_*} пишет лишнее событие. */
    public static String normalizeValstr(String value) {
        if (value == null || value.isEmpty()) {
            return null;
        }
        if (value.length() > VALSTR_MAX) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, VALSTR_TOO_LONG);
        }
        return value;
    }

    /**
     * UPDATE строки вызывает {@code *_set_skvparam} и обнуляет нормы зависимых работ,
     * поэтому неизменённые строки не пишутся.
     */
    public static boolean sameValues(
            BigDecimal currentZnval,
            BigDecimal currentVal,
            String currentValstr,
            BigDecimal znval,
            BigDecimal val,
            String valstr) {
        return sameNumber(currentZnval, znval)
                && sameNumber(currentVal, val)
                && Objects.equals(emptyToNull(currentValstr), valstr);
    }

    public static String key(BigDecimal parcode, BigDecimal prnum) {
        if (parcode == null || prnum == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, PARAM_NOT_FOUND);
        }
        return parcode.stripTrailingZeros().toPlainString() + ":" + prnum.stripTrailingZeros().toPlainString();
    }

    private static boolean sameNumber(BigDecimal a, BigDecimal b) {
        if (a == null || b == null) {
            return a == null && b == null;
        }
        return a.compareTo(b) == 0;
    }

    private static String emptyToNull(String value) {
        return value == null || value.isEmpty() ? null : value;
    }
}
