package burnar.naryad.global.dto;

import java.math.BigDecimal;

/** Строка поиска скважины. Названия для записи — исходные {@code common_spr.nm}. */
public class WellSearchRowDto {

    private final BigDecimal wellId;
    private final String wellNm;
    private final String wellLabel;
    private final BigDecimal kustId;
    private final String kustNm;
    private final String kustLabel;
    private final BigDecimal mestId;
    private final String mestNm;
    private final String tehmesto;

    public WellSearchRowDto(
            BigDecimal wellId,
            String wellNm,
            String wellLabel,
            BigDecimal kustId,
            String kustNm,
            String kustLabel,
            BigDecimal mestId,
            String mestNm,
            String tehmesto) {
        this.wellId = wellId;
        this.wellNm = wellNm;
        this.wellLabel = wellLabel;
        this.kustId = kustId;
        this.kustNm = kustNm;
        this.kustLabel = kustLabel;
        this.mestId = mestId;
        this.mestNm = mestNm;
        this.tehmesto = tehmesto;
    }

    public BigDecimal getWellId() {
        return wellId;
    }

    public String getWellNm() {
        return wellNm;
    }

    public String getWellLabel() {
        return wellLabel;
    }

    public BigDecimal getKustId() {
        return kustId;
    }

    public String getKustNm() {
        return kustNm;
    }

    public String getKustLabel() {
        return kustLabel;
    }

    public BigDecimal getMestId() {
        return mestId;
    }

    public String getMestNm() {
        return mestNm;
    }

    public String getTehmesto() {
        return tehmesto;
    }
}
