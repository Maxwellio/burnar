package burnar.dto;

import com.fasterxml.jackson.annotation.JsonCreator;
import com.fasterxml.jackson.annotation.JsonProperty;

import java.util.List;

public class NaryadNodeIdsRequest {

    private final List<Long> nodeIds;

    @JsonCreator
    public NaryadNodeIdsRequest(@JsonProperty("nodeIds") List<Long> nodeIds) {
        this.nodeIds = nodeIds;
    }

    public List<Long> getNodeIds() {
        return nodeIds;
    }
}
