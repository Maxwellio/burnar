package burnar.naryad.global.dto;

import com.fasterxml.jackson.annotation.JsonCreator;
import com.fasterxml.jackson.annotation.JsonProperty;

import java.math.BigDecimal;
import java.util.List;

/** Текущая шапка, изменённые строки параметров и, если флажки менялись, их новый состав. */
public class NaryadGlobalSaveRequest {

    private final Integer ownerNar;
    private final String shifr;
    private final String nm;
    private final List<Param> params;
    private final Boolean checksChanged;
    private final List<Integer> wellTypeIds;
    private final List<Integer> reportParamIds;

    @JsonCreator
    public NaryadGlobalSaveRequest(
            @JsonProperty("ownerNar") Integer ownerNar,
            @JsonProperty("shifr") String shifr,
            @JsonProperty("nm") String nm,
            @JsonProperty("params") List<Param> params,
            @JsonProperty("checksChanged") Boolean checksChanged,
            @JsonProperty("wellTypeIds") List<Integer> wellTypeIds,
            @JsonProperty("reportParamIds") List<Integer> reportParamIds) {
        this.ownerNar = ownerNar;
        this.shifr = shifr;
        this.nm = nm;
        this.params = params;
        this.checksChanged = checksChanged;
        this.wellTypeIds = wellTypeIds;
        this.reportParamIds = reportParamIds;
    }

    public Integer getOwnerNar() {
        return ownerNar;
    }

    public String getShifr() {
        return shifr;
    }

    public String getNm() {
        return nm;
    }

    public List<Param> getParams() {
        return params;
    }

    public Boolean getChecksChanged() {
        return checksChanged;
    }

    public List<Integer> getWellTypeIds() {
        return wellTypeIds;
    }

    public List<Integer> getReportParamIds() {
        return reportParamIds;
    }

    public static class Param {

        private final BigDecimal parcode;
        private final BigDecimal prnum;
        private final BigDecimal znval;
        private final BigDecimal val;
        private final String valstr;

        @JsonCreator
        public Param(
                @JsonProperty("parcode") BigDecimal parcode,
                @JsonProperty("prnum") BigDecimal prnum,
                @JsonProperty("znval") BigDecimal znval,
                @JsonProperty("val") BigDecimal val,
                @JsonProperty("valstr") String valstr) {
            this.parcode = parcode;
            this.prnum = prnum;
            this.znval = znval;
            this.val = val;
            this.valstr = valstr;
        }

        public BigDecimal getParcode() {
            return parcode;
        }

        public BigDecimal getPrnum() {
            return prnum;
        }

        public BigDecimal getZnval() {
            return znval;
        }

        public BigDecimal getVal() {
            return val;
        }

        public String getValstr() {
            return valstr;
        }
    }
}
