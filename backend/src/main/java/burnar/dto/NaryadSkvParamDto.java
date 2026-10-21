package burnar.dto;

import java.math.BigDecimal;
import java.util.List;

/**
 * Строка {@code zndefnarzadatrib} / {@code zndefnarvipatrib}: параметр и три вида значения.
 * id = {@code parcode:prnum} — ключ строки для таблицы.
 */
public class NaryadSkvParamDto {

    private final BigDecimal parcode;
    private final BigDecimal prnum;
    private final String nm;
    private final BigDecimal znval;
    private final String znnm;
    private final BigDecimal val;
    private final String valstr;
    private final List<NaryadSkvValueDto> values;

    public NaryadSkvParamDto(
            BigDecimal parcode,
            BigDecimal prnum,
            String nm,
            BigDecimal znval,
            String znnm,
            BigDecimal val,
            String valstr,
            List<NaryadSkvValueDto> values) {
        this.parcode = parcode;
        this.prnum = prnum;
        this.nm = nm;
        this.znval = znval;
        this.znnm = znnm;
        this.val = val;
        this.valstr = valstr;
        this.values = values == null ? List.of() : List.copyOf(values);
    }

    public String getId() {
        return parcode.toPlainString() + ":" + prnum.toPlainString();
    }

    public BigDecimal getParcode() {
        return parcode;
    }

    public BigDecimal getPrnum() {
        return prnum;
    }

    public String getNm() {
        return nm;
    }

    public BigDecimal getZnval() {
        return znval;
    }

    public String getZnnm() {
        return znnm;
    }

    public BigDecimal getVal() {
        return val;
    }

    public String getValstr() {
        return valstr;
    }

    /** Пункты выпадающего списка этого параметра, включая сохранённое значение. */
    public List<NaryadSkvValueDto> getValues() {
        return values;
    }
}
