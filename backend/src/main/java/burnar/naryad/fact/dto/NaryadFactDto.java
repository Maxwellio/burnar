package burnar.naryad.fact.dto;

import java.math.BigDecimal;

/**
 * Факт одной работы в часах, как колонка дерева: {@code round(fact / 60, 2)} при {@code prnum = 2}.
 * Пустое значение — {@code null}.
 */
public class NaryadFactDto {

    private final long id;
    private final BigDecimal fact;

    public NaryadFactDto(long id, BigDecimal fact) {
        this.id = id;
        this.fact = fact;
    }

    public long getId() {
        return id;
    }

    public BigDecimal getFact() {
        return fact;
    }
}
