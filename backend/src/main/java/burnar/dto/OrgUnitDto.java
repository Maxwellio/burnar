package burnar.dto;

/**
 * Элемент справочника оргединиц для админского Select на странице нарядов.
 */
public class OrgUnitDto {

    private final Integer id;
    private final String name;

    public OrgUnitDto(Integer id, String name) {
        this.id = id;
        this.name = name;
    }

    public Integer getId() {
        return id;
    }

    public String getName() {
        return name;
    }
}
