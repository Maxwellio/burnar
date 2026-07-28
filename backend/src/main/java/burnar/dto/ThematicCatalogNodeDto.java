package burnar.dto;

import java.util.ArrayList;
import java.util.List;

/**
 * Узел тематического каталога для полного tree-ответа.
 * children заполняется сервисом после ACL-выборки, поэтому клиент не делает
 * последовательных запросов за потомками.
 */
public class ThematicCatalogNodeDto {

    private Integer id;
    private Integer parentId;
    private String name;
    private Integer operKey;
    private Integer ord;
    private Integer narType;
    private boolean hasChildren;
    private List<ThematicCatalogNodeDto> children = new ArrayList<>();

    public Integer getId() {
        return id;
    }

    public void setId(Integer id) {
        this.id = id;
    }

    public Integer getParentId() {
        return parentId;
    }

    public void setParentId(Integer parentId) {
        this.parentId = parentId;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public Integer getOperKey() {
        return operKey;
    }

    public void setOperKey(Integer operKey) {
        this.operKey = operKey;
    }

    public Integer getOrd() {
        return ord;
    }

    public void setOrd(Integer ord) {
        this.ord = ord;
    }

    public Integer getNarType() {
        return narType;
    }

    public void setNarType(Integer narType) {
        this.narType = narType;
    }

    public boolean isHasChildren() {
        return hasChildren;
    }

    public void setHasChildren(boolean hasChildren) {
        this.hasChildren = hasChildren;
    }

    public List<ThematicCatalogNodeDto> getChildren() {
        return children;
    }

    public void setChildren(List<ThematicCatalogNodeDto> children) {
        this.children = children;
    }
}
