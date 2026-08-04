package burnar.dto;

/**
 * Карточка человека для формы редактирования (не строка списка).
 * Без карьеры/логина — их правят отдельно.
 */
public class ResponsiblePersonDetailDto {

    private Integer id;
    private String fio;
    private String fioreports;
    private String fiorodpad;
    private String tabn;

    public Integer getId() {
        return id;
    }

    public void setId(Integer id) {
        this.id = id;
    }

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
