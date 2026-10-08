package burnar.dto;

import java.math.BigDecimal;

/**
 * Сумма листьев дерева, как CalcItogsNS: задание — n2, выполнение — n2 и fact.
 * Значения уже в часах (round(минуты / 60, 2)).
 */
public class NaryadDurationTotalsDto {

    private BigDecimal duration;
    private BigDecimal normDuration;
    private BigDecimal factDuration;

    public BigDecimal getDuration() {
        return duration;
    }

    public void setDuration(BigDecimal duration) {
        this.duration = duration;
    }

    public BigDecimal getNormDuration() {
        return normDuration;
    }

    public void setNormDuration(BigDecimal normDuration) {
        this.normDuration = normDuration;
    }

    public BigDecimal getFactDuration() {
        return factDuration;
    }

    public void setFactDuration(BigDecimal factDuration) {
        this.factDuration = factDuration;
    }
}
