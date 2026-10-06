package burnar.dto;

import com.fasterxml.jackson.annotation.JsonCreator;
import com.fasterxml.jackson.annotation.JsonProperty;

import java.util.List;

public class NaryadRowsColorRequest {

    private final Integer color;
    private final List<Long> nodeIds;

    @JsonCreator
    public NaryadRowsColorRequest(
            @JsonProperty("color") Integer color,
            @JsonProperty("nodeIds") List<Long> nodeIds) {
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
