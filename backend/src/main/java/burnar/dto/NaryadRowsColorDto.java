package burnar.dto;

import java.util.List;

public class NaryadRowsColorDto {

    private final Integer color;
    private final List<Long> nodeIds;

    public NaryadRowsColorDto(Integer color, List<Long> nodeIds) {
        this.color = color;
        this.nodeIds = nodeIds;
    }

    public Integer getColor() {
        return color;
    }

    public List<Long> getNodeIds() {
        return nodeIds;
    }
}
