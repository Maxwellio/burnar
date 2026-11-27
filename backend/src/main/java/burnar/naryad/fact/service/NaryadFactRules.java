package burnar.naryad.fact.service;

import burnar.naryad.shared.service.NaryadOperCalc;

import java.math.BigDecimal;
import java.math.RoundingMode;

/**
 * Ввод факта без базы. Экран показывает часы ({@code round(fact / 60, 2)}),
 * {@code vipolnenie_norm.fact} хранит минуты {@code numeric(9,3)}.
 * Это путь Delphi при единице вывода «Часы» ({@code OutEdizm = 219}):
 * сетка всегда делит на 60, а запись делит показанное число на {@code kf = 1/60}.
 */
public final class NaryadFactRules {

    public static final String CLOSED_MESSAGE = NaryadOperCalc.CLOSED_MESSAGE;
    public static final String LOCKED_MESSAGE = NaryadOperCalc.LOCKED_MESSAGE;
    public static final String NOT_EDITABLE_MESSAGE = "Факт этой работы нельзя изменить";
    public static final String KORR_MESSAGE =
            "Для этой работы задано правило корреляции. Ввод факта для неё пока не перенесён.";
    public static final String NO_NORM_MESSAGE = "У работы нет нормы";

    private static final BigDecimal MINUTES_PER_HOUR = new BigDecimal("60");
    private static final int FACT_SCALE = 3;
    /** {@code numeric(9,3)}: шесть знаков до запятой. */
    private static final BigDecimal FACT_LIMIT = new BigDecimal("1000000");

    private NaryadFactRules() {
    }

    /**
     * Первая причина отказа. {@code null} — ячейку можно писать.
     * Тип 81 и пустой тип (блок) не выбираются в {@code trGrdNarSelectCell}.
     */
    public static String refusal(boolean closed, boolean locked, Integer operlifetype, boolean kor) {
        if (closed) {
            return CLOSED_MESSAGE;
        }
        if (locked) {
            return LOCKED_MESSAGE;
        }
        if (operlifetype == null || operlifetype == 81) {
            return NOT_EDITABLE_MESSAGE;
        }
        if (kor) {
            return KORR_MESSAGE;
        }
        return null;
    }

    /** Часы с экрана в минуты. Пусто остаётся пустым. Слишком большое число не пишется. */
    public static BigDecimal hoursToMinutes(BigDecimal hours) {
        if (hours == null) {
            return null;
        }
        BigDecimal minutes = hours.multiply(MINUTES_PER_HOUR).setScale(FACT_SCALE, RoundingMode.HALF_UP);
        if (minutes.abs().compareTo(FACT_LIMIT) >= 0) {
            throw new IllegalArgumentException(NaryadOperCalc.ZNACH_OUT_OF_RANGE);
        }
        return minutes;
    }
}
