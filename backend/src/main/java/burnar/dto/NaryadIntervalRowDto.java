package burnar.dto;

import com.fasterxml.jackson.annotation.JsonProperty;

import java.math.BigDecimal;

/**
 * Строка проверки интервалов. {@code colorsel} — код цвета Delphi
 * из {@code getrabmehburintervals} / {@code getrabnarintervals}, не цвет строки наряда.
 */
public class NaryadIntervalRowDto {

    private final long id;
    private final BigDecimal prnum;
    private final String nm;
    private final BigDecimal ot;
    private final BigDecimal do_;
    private final Integer colorsel;

    public NaryadIntervalRowDto(
            long id, BigDecimal prnum, String nm, BigDecimal ot, BigDecimal do_, Integer colorsel) {
        this.id = id;
        this.prnum = prnum;
        this.nm = nm;
        this.ot = ot;
        this.do_ = do_;
        this.colorsel = colorsel;
    }

    public long getId() {
        return id;
    }

    public BigDecimal getPrnum() {
        return prnum;
    }

    public String getNm() {
        return nm;
    }

    public BigDecimal getOt() {
        return ot;
    }

    @JsonProperty("do_")
    public BigDecimal getDo_() {
        return do_;
    }

    public Integer getColorsel() {
        return colorsel;
    }
}
