package burnar.dto;

/**
 * Тело POST/PUT careers → burnar.karjera_add.
 * dateIn/dateOut — ISO yyyy-MM-dd.
 */
public class CareerWriteRequest {

    private String dateIn;
    private String dateOut;
    private Integer orgId;
    private Integer doljId;

    public String getDateIn() {
        return dateIn;
    }

    public void setDateIn(String dateIn) {
        this.dateIn = dateIn;
    }

    public String getDateOut() {
        return dateOut;
    }

    public void setDateOut(String dateOut) {
        this.dateOut = dateOut;
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
