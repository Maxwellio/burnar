package burnar.dto;

/**
 * Заголовок карточки наряда: код + наименование (defnar.key / defnar.nm).
 */
public class NaryadHeaderDto {

    private Integer id;
    private String nameNar;

    public Integer getId() {
        return id;
    }

    public void setId(Integer id) {
        this.id = id;
    }

    public String getNameNar() {
        return nameNar;
    }

    public void setNameNar(String nameNar) {
        this.nameNar = nameNar;
    }
}
