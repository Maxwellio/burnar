package burnar.dto;

/**
 * Заголовок карточки наряда: код + наименование (defnar.key / defnar.nm)
 * и наличие описателей задания/выполнения (defnarzad / defnarvip),
 * как qrCountDefNarZad / qrCountDefNarVip в MainUnit.OpenNar.
 */
public class NaryadHeaderDto {

    private Integer id;
    private String nameNar;
    private Boolean hasZadanie;
    private Boolean hasVipolnenie;

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

    public Boolean getHasZadanie() {
        return hasZadanie;
    }

    public void setHasZadanie(Boolean hasZadanie) {
        this.hasZadanie = hasZadanie;
    }

    public Boolean getHasVipolnenie() {
        return hasVipolnenie;
    }

    public void setHasVipolnenie(Boolean hasVipolnenie) {
        this.hasVipolnenie = hasVipolnenie;
    }
}
