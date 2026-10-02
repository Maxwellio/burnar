package burnar.dto;

public class NaryadRowColorDto {

    private final Long nodeId;
    private final Integer color;

    public NaryadRowColorDto(Long nodeId, Integer color) {
        this.nodeId = nodeId;
        this.color = color;
    }

    public Long getNodeId() {
        return nodeId;
    }

    public Integer getColor() {
        return color;
    }
}
