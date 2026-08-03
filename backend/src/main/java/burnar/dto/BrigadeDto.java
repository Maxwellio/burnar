package burnar.dto;

/**
 * Элемент справочника бригад для SELECT-фильтра колонки «Бригада».
 * Поля id/nm — контракт SelectFilter из mainComponent (value = id, подпись = nm).
 */
public class BrigadeDto {

    private final Integer id;
    private final String nm;

    public BrigadeDto(Integer id, String nm) {
        this.id = id;
        this.nm = nm;
    }

    public Integer getId() {
        return id;
    }

    public String getNm() {
        return nm;
    }
}
