package burnar.dto;

import java.math.BigDecimal;

/**
 * Строка GrdParams: имя параметра + отображаемое значение (qrParamZ / qrParamV).
 * ptype/parcode/znachCode/isSkv скрыты в UI, нужны для редактирования позже.
 */
public class NaryadOperParamDto {

    private String nm;
    private String val;
    private Integer ptype;
    private BigDecimal parcode;
    private BigDecimal znachCode;
    private Integer isSkv;

    public String getNm() {
        return nm;
    }

    public void setNm(String nm) {
        this.nm = nm;
    }

    public String getVal() {
        return val;
    }

    public void setVal(String val) {
        this.val = val;
    }

    public Integer getPtype() {
        return ptype;
    }

    public void setPtype(Integer ptype) {
        this.ptype = ptype;
    }

    public BigDecimal getParcode() {
        return parcode;
    }

    public void setParcode(BigDecimal parcode) {
        this.parcode = parcode;
    }

    public BigDecimal getZnachCode() {
        return znachCode;
    }

    public void setZnachCode(BigDecimal znachCode) {
        this.znachCode = znachCode;
    }

    public Integer getIsSkv() {
        return isSkv;
    }

    public void setIsSkv(Integer isSkv) {
        this.isSkv = isSkv;
    }
}
