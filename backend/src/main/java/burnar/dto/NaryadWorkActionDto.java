package burnar.dto;

/** Поля строки, от которых зависит кнопка удаления блока. */
public class NaryadWorkActionDto {

    private final Long id;
    private final Integer operlifetype;
    private final Integer locked;
    private final String rs;

    public NaryadWorkActionDto(Long id, Integer operlifetype, Integer locked, String rs) {
        this.id = id;
        this.operlifetype = operlifetype;
        this.locked = locked;
        this.rs = rs;
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
}
