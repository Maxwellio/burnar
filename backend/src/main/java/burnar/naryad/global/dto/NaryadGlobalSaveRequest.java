package burnar.naryad.global.dto;

import burnar.naryad.skv.dto.NaryadSkvSaveRequest;

import com.fasterxml.jackson.annotation.JsonCreator;
import com.fasterxml.jackson.annotation.JsonProperty;

import java.util.List;

/** Текущая шапка, изменённые строки параметров и, если флажки менялись, их новый состав. */
public class NaryadGlobalSaveRequest {

    private final Integer ownerNar;
    private final String shifr;
    private final String nm;
    private final List<NaryadSkvSaveRequest.Param> params;
    private final Boolean checksChanged;
    private final List<Integer> wellTypeIds;
    private final List<Integer> reportParamIds;

    @JsonCreator
    public NaryadGlobalSaveRequest(
            @JsonProperty("ownerNar") Integer ownerNar,
            @JsonProperty("shifr") String shifr,
            @JsonProperty("nm") String nm,
            @JsonProperty("params") List<NaryadSkvSaveRequest.Param> params,
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

    public List<NaryadSkvSaveRequest.Param> getParams() {
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
}
