package burnar.dto;

import java.math.BigDecimal;

/**
 * Строка дерева для кнопок буфера: родитель, тип, блокировка, имя.
 * Отдаётся целиком на наряд, чтобы видеть блок и работу внутри него.
 */
public class NaryadStructureNodeDto {

    private Long id;
    private Long parentId;
    private BigDecimal prnum;
    private Integer operlifetype;
    private Integer locked;
    private String rs;
    private String nm;
    private boolean hasChildren;

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public Long getParentId() {
        return parentId;
    }

    public void setParentId(Long parentId) {
        this.parentId = parentId;
    }

    public BigDecimal getPrnum() {
        return prnum;
    }

    public void setPrnum(BigDecimal prnum) {
        this.prnum = prnum;
    }

    public Integer getOperlifetype() {
        return operlifetype;
    }

    public void setOperlifetype(Integer operlifetype) {
        this.operlifetype = operlifetype;
    }

    public Integer getLocked() {
        return locked;
    }

    public void setLocked(Integer locked) {
        this.locked = locked;
    }

    public String getRs() {
        return rs;
    }

    public void setRs(String rs) {
        this.rs = rs;
    }

    public String getNm() {
        return nm;
    }

    public void setNm(String nm) {
        this.nm = nm;
    }

    public boolean getHasChildren() {
        return hasChildren;
    }

    public void setHasChildren(boolean hasChildren) {
        this.hasChildren = hasChildren;
    }
}
