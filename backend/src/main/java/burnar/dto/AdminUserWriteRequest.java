package burnar.dto;

/**
 * Тело POST/PUT /api/admin/users: people-поля + опциональная учётка.
 * Пароль — plaintext; bcrypt и CALL add_user делает AdminUserService.
 * dateIn/orgId/doljId нужны только на create (people_add).
 */
public class AdminUserWriteRequest {

    private String fio;
    private String fioreports;
    private String fiorodpad;
    private String dateIn;
    private Integer orgId;
    private Integer doljId;
    private String oraName;
    private String password;
    private Boolean active;
    private String note;
    private String dtEnter;
    private String dtOut;

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

    public String getOraName() {
        return oraName;
    }

    public void setOraName(String oraName) {
        this.oraName = oraName;
    }

    public String getPassword() {
        return password;
    }

    public void setPassword(String password) {
        this.password = password;
    }

    public Boolean getActive() {
        return active;
    }

    public void setActive(Boolean active) {
        this.active = active;
    }

    public String getNote() {
        return note;
    }

    public void setNote(String note) {
        this.note = note;
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
}
