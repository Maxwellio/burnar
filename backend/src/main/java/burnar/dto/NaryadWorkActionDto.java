package burnar.dto;

/** Поля строки для кнопок: удаление блока, расчёт операции. */
public class NaryadWorkActionDto {

    private final Long id;
    private final Integer operlifetype;
    private final Integer locked;
    private final String rs;
    private final boolean hasChildren;

    public NaryadWorkActionDto(
            Long id, Integer operlifetype, Integer locked, String rs, boolean hasChildren) {
        this.id = id;
        this.operlifetype = operlifetype;
        this.locked = locked;
        this.rs = rs;
        this.hasChildren = hasChildren;
    }

    public Long getId() {
        return id;
    }

    public Integer getOperlifetype() {
        return operlifetype;
    }

    public Integer getLocked() {
        return locked;
    }

    public String getRs() {
        return rs;
    }

    public boolean getHasChildren() {
        return hasChildren;
    }
}
