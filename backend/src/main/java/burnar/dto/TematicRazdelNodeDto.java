package burnar.dto;

/**
 * Узел дерева тематических разделов для BaseTreeTable.
 * id = tematic_razdel.id (код раздела); name — t.nm либо spr_oper.nm;
 * oper — код операции (null = раздел). parentId/ord/nartype скрыты в UI,
 * нужны для кнопок вставки в наряд позже. children с сервера не отдаём —
 * BaseTreeTable сам грузит GET .../{id}/children.
 */
public class TematicRazdelNodeDto {

    private Integer id;
    private String name;
    private Integer oper;
    private Integer parentId;
    private Integer ord;
    private Integer nartype;
    private boolean hasChildren;

    public Integer getId() {
        return id;
    }

    public void setId(Integer id) {
        this.id = id;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public Integer getOper() {
        return oper;
    }

    public void setOper(Integer oper) {
        this.oper = oper;
    }

    public Integer getParentId() {
        return parentId;
    }

    public void setParentId(Integer parentId) {
        this.parentId = parentId;
    }

    public Integer getOrd() {
        return ord;
    }

    public void setOrd(Integer ord) {
        this.ord = ord;
    }

    public Integer getNartype() {
        return nartype;
    }

    public void setNartype(Integer nartype) {
        this.nartype = nartype;
    }

    public boolean getHasChildren() {
        return hasChildren;
    }

    public void setHasChildren(boolean hasChildren) {
        this.hasChildren = hasChildren;
    }
}
