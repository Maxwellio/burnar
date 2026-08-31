package burnar.dto;

/**
 * Мастер наряда: people.id + ФИО. Для админской приписки в колонке «Мастер»;
 * поиск колонки идёт по getmasters (только имена), не по этому id.
 */
public class NaryadMasterDto {

    private Integer id;
    private String fio;

    public NaryadMasterDto() {
    }

    public NaryadMasterDto(Integer id, String fio) {
        this.id = id;
        this.fio = fio;
    }

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
}
