package burnar.dto;

/**
 * Строка списка ответственных лиц (левая BaseTable).
 * id = people.id — BaseTable.setSelectedId читает row.original.id.
 */
public class ResponsiblePersonDto {

    private Integer id;
    private String fio;
    private String oraName;

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

    public String getOraName() {
        return oraName;
    }

    public void setOraName(String oraName) {
        this.oraName = oraName;
    }
}
