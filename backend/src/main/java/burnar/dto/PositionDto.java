package burnar.dto;

/**
 * Строка справочника должностей (BaseTable в модалке админки).
 * id = sprdoljnost.key — setSelectedId читает row.original.id.
 * rank в API не отдаём: в UI только код и наименование.
 */
public class PositionDto {

    private Integer id;
    private String nm;

    public Integer getId() {
        return id;
    }

    public void setId(Integer id) {
        this.id = id;
    }

    public String getNm() {
        return nm;
    }

    public void setNm(String nm) {
        this.nm = nm;
    }
}
