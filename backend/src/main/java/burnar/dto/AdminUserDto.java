package burnar.dto;

/**
 * Строка списка админ-панели (левая BaseTable, GET /api/admin/users).
 * id = people.id — setSelectedId читает row.original.id.
 * См. docs/admin-panel-notes.md.
 */
public class AdminUserDto {

    private Integer id;
    private Integer usersId;
    private String fio;
    private String oraName;
    /** 1 — активен, 0 — нет; null если учётки нет. */
    private Integer active;
    private String dtEnter;
    private String dtOut;
    private String note;

    public Integer getId() {
        return id;
    }

    public void setId(Integer id) {
        this.id = id;
    }

    public Integer getUsersId() {
        return usersId;
    }

    public void setUsersId(Integer usersId) {
        this.usersId = usersId;
    }

    public String getFio() {
        return fio;
    }

    public void setFio(String fio) {
        this.fio = fio;
    }

    public String getOraName() {
        return oraName;
    }

    public void setOraName(String oraName) {
        this.oraName = oraName;
    }

    public Integer getActive() {
        return active;
    }

    public void setActive(Integer active) {
        this.active = active;
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

    public String getNote() {
        return note;
    }

    public void setNote(String note) {
        this.note = note;
    }
}
