package burnar.naryad.global.service;

import org.springframework.http.HttpStatus;
import org.springframework.web.server.ResponseStatusException;

import java.math.BigDecimal;
import java.sql.Timestamp;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.Objects;

/**
 * Правила окна общих параметров (Delphi {@code GlobalVarUnit}) без доступа к базе.
 * {@code val} — {@code numeric(9,3)}; ноль хранится как NULL, как подстановка в сохранении грида.
 * {@code shifr} — {@code varchar(20)}, {@code nm} — {@code varchar(50)}, {@code valstr} — {@code varchar(150)}.
 */
public final class NaryadGlobalParams {

    public static final String SHIFR_TOO_LONG = "Шифр объекта длиннее 20 символов";
    public static final String NM_TOO_LONG = "Наименование наряда длиннее 50 символов";
    public static final String VAL_OUT_OF_RANGE = "Числовое значение должно быть меньше 1000000 по модулю";
    public static final String LOCATION_READONLY = "Скважина, куст и месторождение меняются поиском скважины";
    public static final String PARAM_NOT_FOUND = "Параметр наряда не найден";
    public static final String CHECK_NOT_FOUND = "Пункт отчёта не найден";

    static final int SHIFR_MAX = 20;
    static final int NM_MAX = 50;
    static final int VAL_SCALE = 3;
    static final BigDecimal VAL_LIMIT = new BigDecimal("1000000");

    private static final DateTimeFormatter CREATEDATE = DateTimeFormatter.ofPattern("dd.MM.yyyy HH:mm:ss");
    private static final BigDecimal MEST = new BigDecimal("5");
    private static final BigDecimal SKV = new BigDecimal("149");
    private static final BigDecimal KUST = new BigDecimal("470");

    private NaryadGlobalParams() {
    }

    /** Скважина, месторождение и куст до формы поиска только показываются. */
    public static boolean locationParam(BigDecimal parcode) {
        return sameNumber(parcode, MEST) || sameNumber(parcode, SKV) || sameNumber(parcode, KUST);
    }

    public static boolean headerLocked(boolean closed) {
        return closed;
    }

    public static boolean referenceEditable(boolean closed, BigDecimal parcode) {
        return !closed && !locationParam(parcode);
    }

    public static boolean valueEditable(boolean closed, BigDecimal parcode) {
        return referenceEditable(closed, parcode);
    }

    /** Закрыто задание или выполнение: {@code coalesce(closed, 0)} каждой части. */
    public static boolean closed(Integer zadanieClosed, Integer vipolnenieClosed) {
        return positive(zadanieClosed) || positive(vipolnenieClosed);
    }

    public static String normalizeShifr(String raw) {
        return normalizeText(raw, SHIFR_MAX, SHIFR_TOO_LONG);
    }

    public static String normalizeNm(String raw) {
        return normalizeText(raw, NM_MAX, NM_TOO_LONG);
    }

    /** Ноль после округления до трёх знаков пишется как пусто. */
    @SuppressWarnings("deprecation") // константа BigDecimal, как у сквозных параметров
    public static BigDecimal normalizeVal(BigDecimal value) {
        if (value == null) {
            return null;
        }
        BigDecimal scaled = value.setScale(VAL_SCALE, BigDecimal.ROUND_HALF_UP);
        if (scaled.signum() == 0) {
            return null;
        }
        if (scaled.abs().compareTo(VAL_LIMIT) >= 0) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, VAL_OUT_OF_RANGE);
        }
        return scaled;
    }

    public static String formatCreatedate(Timestamp value) {
        return value == null ? null : value.toLocalDateTime().format(CREATEDATE);
    }

    /**
     * Сравнение шапки после нормализации: пустая строка и NULL — одно значение,
     * пробелы по краям не считаются правкой.
     */
    public static boolean headerChanged(
            Integer savedOwner,
            String savedShifr,
            String savedNm,
            Integer owner,
            String shifr,
            String nm) {
        return !Objects.equals(savedOwner, owner)
                || !Objects.equals(normalizeShifr(savedShifr), normalizeShifr(shifr))
                || !Objects.equals(normalizeNm(savedNm), normalizeNm(nm));
    }

    /** Состав флажков без учёта порядка. Пустой список и null совпадают. */
    public static boolean sameIds(List<Integer> left, List<Integer> right) {
        return canonical(left).equals(canonical(right));
    }

    public static String key(BigDecimal parcode, BigDecimal prnum) {
        if (parcode == null || prnum == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, PARAM_NOT_FOUND);
        }
        return parcode.stripTrailingZeros().toPlainString()
                + ":"
                + prnum.stripTrailingZeros().toPlainString();
    }

    private static String normalizeText(String raw, int max, String tooLong) {
        if (raw == null) {
            return null;
        }
        String text = raw.trim();
        if (text.isEmpty()) {
            return null;
        }
        if (text.length() > max) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, tooLong);
        }
        return text;
    }

    private static boolean positive(Integer value) {
        return value != null && value != 0;
    }

    private static boolean sameNumber(BigDecimal left, BigDecimal right) {
        if (left == null || right == null) {
            return left == null && right == null;
        }
        return left.compareTo(right) == 0;
    }

    private static List<Integer> canonical(List<Integer> ids) {
        if (ids == null || ids.isEmpty()) {
            return List.of();
        }
        List<Integer> copy = new ArrayList<>();
        for (Integer id : ids) {
            if (id != null && !copy.contains(id)) {
                copy.add(id);
            }
        }
        copy.sort(Comparator.naturalOrder());
        return copy;
    }
}
