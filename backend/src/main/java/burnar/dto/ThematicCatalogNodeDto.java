package burnar.dto;

import java.util.ArrayList;
import java.util.List;

/**
 * Узел eager-дерева тематического каталога для GET /api/catalog/tree.
 * Для операции name уже содержит название из public.spr_oper, как в основном MDI Delphi.
 */
public class ThematicCatalogNodeDto {

    private Integer id;
    private Integer parentId;
    private String name;
    private Integer operationId;
    private Integer ord;
    private Integer narType;
    private boolean hasChildren;
    private List<ThematicCatalogNodeDto> children = new ArrayList<>();

    public ThematicCatalogNodeDto() {
    }

    public ThematicCatalogNodeDto(
            Integer id,
            Integer parentId,
            String name,
            Integer operationId,
            Integer ord,
            Integer narType) {
        this.id = id;
        this.parentId = parentId;
        this.name = name;
        this.operationId = operationId;
        this.ord = ord;
        this.narType = narType;
    }

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

    public Integer getOperationId() {
        return operationId;
    }

    public void setOperationId(Integer operationId) {
        this.operationId = operationId;
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
