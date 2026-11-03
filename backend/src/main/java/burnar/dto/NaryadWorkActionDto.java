package burnar.dto;

/** Поля строки для кнопок: удаление блока, расчёт операции, оперкарта. */
public class NaryadWorkActionDto {

    private final Long id;
    private final Integer operlifetype;
    private final Integer locked;
    private final String rs;
    private final boolean hasChildren;
    private final boolean hasOcard;

    public NaryadWorkActionDto(
            Long id, Integer operlifetype, Integer locked, String rs, boolean hasChildren, boolean hasOcard) {
        this.id = id;
        this.operlifetype = operlifetype;
        this.locked = locked;
        this.rs = rs;
        this.hasChildren = hasChildren;
        this.hasOcard = hasOcard;
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

    /** Есть файл оперкарты в istochniki по основному источнику или источнику строки. */
    public boolean getHasOcard() {
        return hasOcard;
    }
}
