package burnar.dto;

/**
 * Тело POST /responsible-persons → burnar.people_add (acodr3 всегда null).
 * dateIn — ISO yyyy-MM-dd; orgId/doljId — org_stru.id / sprdoljnost.key.
 */
public class ResponsiblePersonCreateRequest {

    private String fio;
    private String fioreports;
    private String fiorodpad;
    private String tabn;
    private String dateIn;
    private Integer orgId;
    private Integer doljId;

    public String getFio() {
        return fio;
    }

    public void setFio(String fio) {
        this.fio = fio;
    }

    public String getFioreports() {
        return fioreports;
    }

    public void setFioreports(String fioreports) {
        this.fioreports = fioreports;
    }

    public String getFiorodpad() {
        return fiorodpad;
    }

    public void setFiorodpad(String fiorodpad) {
        this.fiorodpad = fiorodpad;
    }

    public String getTabn() {
        return tabn;
    }

    public void setTabn(String tabn) {
        this.tabn = tabn;
    }

    public String getDateIn() {
        return dateIn;
    }

    public void setDateIn(String dateIn) {
        this.dateIn = dateIn;
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
