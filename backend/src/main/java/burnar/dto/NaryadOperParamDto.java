package burnar.dto;

import java.math.BigDecimal;
import java.util.List;

/**
 * Строка GrdParams: имя параметра и значение (qrParamZ / qrParamV).
 * ptype 1 — ручной ввод, ptype 2 — список values. editable — можно менять ячейку.
 */
public class NaryadOperParamDto {

    private String nm;
    private String val;
    private Integer ptype;
    private BigDecimal parcode;
    private BigDecimal znachCode;
    private Integer isSkv;
    private Long nodeId;
    private Boolean editable;
    private List<NaryadSkvValueDto> values;

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

    public Long getNodeId() {
        return nodeId;
    }

    public void setNodeId(Long nodeId) {
        this.nodeId = nodeId;
    }

    public Boolean getEditable() {
        return editable;
    }

    public void setEditable(Boolean editable) {
        this.editable = editable;
    }

    public List<NaryadSkvValueDto> getValues() {
        return values;
    }

    public void setValues(List<NaryadSkvValueDto> values) {
        this.values = values;
    }
}
