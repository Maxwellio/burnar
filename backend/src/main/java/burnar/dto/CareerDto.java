package burnar.dto;

/**
 * Период карьеры (правая BaseTable + форма).
 * id = karjera.key; dtEnter/dtOut — yyyy-MM-dd; orgId/doljId — для CareerFormDialog.
 */
public class CareerDto {

    private Integer id;
    private String dtEnter;
    private String dtOut;
    private String doljNm;
    private String orgNm;
    private Integer orgId;
    private Integer doljId;

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

    public Integer getOrgId() {
        return orgId;
    }

    public void setOrgId(Integer orgId) {
        this.orgId = orgId;
    }

    public Integer getDoljId() {
        return doljId;
    }

    public void setDoljId(Integer doljId) {
        this.doljId = doljId;
    }
}
