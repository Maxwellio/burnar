package burnar.service;

import java.math.BigDecimal;
import java.util.Collection;

/**
 * Правила расчёта операции и значения параметра без доступа к базе.
 * Непрерывное значение — {@code numeric(16,4)} в {@code zadanie_param.znach} /
 * {@code vipolnenie_param.znach}. Дискретный параметр хранит код {@code zn_dparam.key}.
 */
public final class NaryadOperCalc {

    public static final String CLOSED_MESSAGE = "Наряд закрыт от изменений";
    public static final String LOCKED_MESSAGE = "Работа заблокирована";
    public static final String NOT_LEAF_MESSAGE = "Расчёт доступен только для работы без вложенных";
    public static final String WRONG_TYPE_MESSAGE = "Расчёт доступен для комбинации и алгоритма";
    public static final String PARAMS_TYPE_MESSAGE = "Параметры этой работы нельзя изменить";
    public static final String NOT_EDITABLE_TYPE = "Параметр нельзя изменить";
    public static final String ZNACH_OUT_OF_RANGE = "Число слишком большое";
    public static final String VALUE_NOT_IN_LIST = "Значение не входит в список параметра";
    public static final String PARAM_NOT_FOUND = "Параметр операции не найден";
    public static final String NO_OPERLIFE = "У работы нет нормообразования";
    public static final String NO_IZMER = "Не задан измеритель наряда";

    static final int ZNACH_SCALE = 4;
    /** numeric(16,4): не больше 12 знаков до запятой. */
    static final BigDecimal ZNACH_LIMIT = new BigDecimal("1000000000000");

    private NaryadOperCalc() {
    }

    public static boolean isCalculable(Integer type) {
        return type != null && (type == 79 || type == 80);
    }

    /** Первая причина, по которой расчёт нельзя запускать. null — можно. */
    public static String calcRefusal(boolean closed, boolean locked, boolean hasChildren, Integer type) {
        if (closed) {
            return CLOSED_MESSAGE;
        }
        if (locked) {
            return LOCKED_MESSAGE;
        }
        if (hasChildren) {
            return NOT_LEAF_MESSAGE;
        }
        if (!isCalculable(type)) {
            return WRONG_TYPE_MESSAGE;
        }
        return null;
    }

    /** Закрытая часть и заблокированная работа выполнения не правятся. ptype 1 или 2. */
    public static String paramRefusal(boolean closed, boolean locked, Integer ptype) {
        if (closed) {
            return CLOSED_MESSAGE;
        }
        if (locked) {
            return LOCKED_MESSAGE;
        }
        if (ptype == null || (ptype != 1 && ptype != 2)) {
            return NOT_EDITABLE_TYPE;
        }
        return null;
    }

    @SuppressWarnings("deprecation") // константа BigDecimal, как в NaryadSkvParams.normalizeVal
    public static BigDecimal normalizeZnach(BigDecimal value) {
        if (value == null) {
            return null;
        }
        BigDecimal scaled = value.setScale(ZNACH_SCALE, BigDecimal.ROUND_HALF_UP);
        if (scaled.abs().compareTo(ZNACH_LIMIT) >= 0) {
            throw new IllegalArgumentException(ZNACH_OUT_OF_RANGE);
        }
        return scaled;
    }

    public static boolean sameZnach(BigDecimal current, BigDecimal next) {
        if (current == null || next == null) {
            return current == null && next == null;
        }
        return current.compareTo(next) == 0;
    }

    /** null — пустой выбор, его можно сохранить. Иначе код должен быть в списке. */
    public static boolean listed(BigDecimal value, Collection<BigDecimal> allowed) {
        if (value == null) {
            return true;
        }
        if (allowed == null) {
            return false;
        }
        for (BigDecimal item : allowed) {
            if (item != null && item.compareTo(value) == 0) {
                return true;
            }
        }
        return false;
    }

    /** Пустая строка настройки — SQL NULL. Ноль остаётся нулём. */
    public static BigDecimal settingDecimal(String raw) {
        if (raw == null || raw.isBlank()) {
            return null;
        }
        return new BigDecimal(raw.trim());
    }

    public static boolean rebuilt(String raw) {
        BigDecimal value = settingDecimal(raw);
        return value != null && value.compareTo(BigDecimal.ONE) == 0;
    }

    /** presentFlag "1" — текст задан, в том числе пустой. Иначе NULL, ячейку не затираем. */
    public static String settingText(String raw, String presentFlag) {
        if (!"1".equals(presentFlag)) {
            return null;
        }
        return raw == null ? "" : raw;
    }
}
