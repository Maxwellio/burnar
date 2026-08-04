package burnar.dto;

/**
 * Тело PUT /responsible-persons/{id} — только people-поля (карьера не трогается).
 */
public class ResponsiblePersonUpdateRequest {

    private String fio;
    private String fioreports;
    private String fiorodpad;
    private String tabn;

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
}
