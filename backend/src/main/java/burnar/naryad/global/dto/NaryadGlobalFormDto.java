package burnar.naryad.global.dto;

import burnar.naryad.list.dto.BrigadeDto;

import java.util.List;

/** Шапка общих параметров, списки бригад и флажки отчёта. Таблица параметров — отдельным запросом. */
public class NaryadGlobalFormDto {

    private final boolean closed;
    private final Integer ownerNar;
    private final String ownerNarNm;
    private final List<BrigadeDto> brigades;
    private final String createdate;
    private final String masters;
    private final String authorNm;
    private final String shifr;
    private final String nartypeNm;
    private final String nm;
    private final List<NaryadGlobalCheckDto> wellTypes;
    private final List<NaryadGlobalCheckDto> reportParams;

    public NaryadGlobalFormDto(
            boolean closed,
            Integer ownerNar,
            String ownerNarNm,
            List<BrigadeDto> brigades,
            String createdate,
            String masters,
            String authorNm,
            String shifr,
            String nartypeNm,
            String nm,
            List<NaryadGlobalCheckDto> wellTypes,
            List<NaryadGlobalCheckDto> reportParams) {
        this.closed = closed;
        this.ownerNar = ownerNar;
        this.ownerNarNm = ownerNarNm;
        this.brigades = brigades == null ? List.of() : List.copyOf(brigades);
        this.createdate = createdate;
        this.masters = masters;
        this.authorNm = authorNm;
        this.shifr = shifr;
        this.nartypeNm = nartypeNm;
        this.nm = nm;
        this.wellTypes = wellTypes == null ? List.of() : List.copyOf(wellTypes);
        this.reportParams = reportParams == null ? List.of() : List.copyOf(reportParams);
    }

    public boolean isClosed() {
        return closed;
    }

    public Integer getOwnerNar() {
        return ownerNar;
    }

    public String getOwnerNarNm() {
        return ownerNarNm;
    }

    public List<BrigadeDto> getBrigades() {
        return brigades;
    }

    public String getCreatedate() {
        return createdate;
    }

    public String getMasters() {
        return masters;
    }

    public String getAuthorNm() {
        return authorNm;
    }

    public String getShifr() {
        return shifr;
    }

    public String getNartypeNm() {
        return nartypeNm;
    }

    public String getNm() {
        return nm;
    }

    public List<NaryadGlobalCheckDto> getWellTypes() {
        return wellTypes;
    }

    public List<NaryadGlobalCheckDto> getReportParams() {
        return reportParams;
    }
}
