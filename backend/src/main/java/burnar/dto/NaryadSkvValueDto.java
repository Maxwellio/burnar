package burnar.dto;

import java.math.BigDecimal;

/** Пункт выпадающего списка справочного значения: {@code common_spr.id} / {@code nm}. */
public class NaryadSkvValueDto {

    private final BigDecimal id;
    private final String nm;

    public NaryadSkvValueDto(BigDecimal id, String nm) {
        this.id = id;
        this.nm = nm;
    }

    public BigDecimal getId() {
        return id;
    }

    public String getNm() {
        return nm;
    }
}
