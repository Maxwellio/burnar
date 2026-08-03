package burnar.dto;

/**
 * Период карьеры ответственного лица (правая BaseTable).
 * id = karjera.key — нужен будущим кнопкам edit/delete.
 * orgNm — полный путь по org_stru.parent (как в Delphi qrKarera).
 */
public class CareerDto {

    private Integer id;
    private String dtEnter;
    private String dtOut;
    private String doljNm;
    private String orgNm;

    public Integer getId() {
        return id;
    }

    public void setId(Integer id) {
        this.id = id;
    }

    public String getDtEnter() {
        return dtEnter;
    }

    public void setDtEnter(String dtEnter) {
        this.dtEnter = dtEnter;
    }

    public String getDtOut() {
        return dtOut;
    }

    public void setDtOut(String dtOut) {
        this.dtOut = dtOut;
    }

    public String getDoljNm() {
        return doljNm;
    }

    public void setDoljNm(String doljNm) {
        this.doljNm = doljNm;
    }

    public String getOrgNm() {
        return orgNm;
    }

    public void setOrgNm(String orgNm) {
        this.orgNm = orgNm;
    }
}
