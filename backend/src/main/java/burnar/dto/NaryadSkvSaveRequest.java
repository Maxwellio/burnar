package burnar.dto;

import com.fasterxml.jackson.annotation.JsonCreator;
import com.fasterxml.jackson.annotation.JsonProperty;

import java.math.BigDecimal;
import java.util.List;

/** Дата начала работ и изменённые строки сквозных параметров. */
public class NaryadSkvSaveRequest {

    private final String begDate;
    private final List<Param> params;

    @JsonCreator
    public NaryadSkvSaveRequest(
            @JsonProperty("begDate") String begDate,
            @JsonProperty("params") List<Param> params) {
        this.begDate = begDate;
        this.params = params;
    }

    public String getBegDate() {
        return begDate;
    }

    public List<Param> getParams() {
        return params;
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
