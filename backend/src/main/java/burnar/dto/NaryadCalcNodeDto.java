package burnar.dto;

import com.fasterxml.jackson.annotation.JsonInclude;
import com.fasterxml.jackson.annotation.JsonProperty;

import java.math.BigDecimal;

/**
 * Поля строки после расчёта. Null не отдаём: Delphi не затирает ячейку,
 * если процедура вернула NULL.
 */
@JsonInclude(JsonInclude.Include.NON_NULL)
public class NaryadCalcNodeDto {

    private final Long id;
    private final BigDecimal n1;
    private final BigDecimal n2;
    private final String istnorm;
    private final BigDecimal ot;
    private final BigDecimal do_;

    public NaryadCalcNodeDto(
            Long id, BigDecimal n1, BigDecimal n2, String istnorm, BigDecimal ot, BigDecimal do_) {
        this.id = id;
        this.n1 = n1;
        this.n2 = n2;
        this.istnorm = istnorm;
        this.ot = ot;
        this.do_ = do_;
    }

    public Long getId() {
        return id;
    }

    public BigDecimal getN1() {
        return n1;
    }

    public BigDecimal getN2() {
        return n2;
    }

    public String getIstnorm() {
        return istnorm;
    }

    public BigDecimal getOt() {
        return ot;
    }

    @JsonProperty("do_")
    public BigDecimal getDo_() {
        return do_;
    }
}
