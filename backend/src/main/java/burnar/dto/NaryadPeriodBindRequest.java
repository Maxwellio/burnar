package burnar.dto;

import com.fasterxml.jackson.annotation.JsonCreator;
import com.fasterxml.jackson.annotation.JsonProperty;

import java.util.List;

public class NaryadPeriodBindRequest {

    private final Long periodKey;
    private final List<Long> nodeIds;

    @JsonCreator
    public NaryadPeriodBindRequest(
            @JsonProperty("periodKey") Long periodKey,
            @JsonProperty("nodeIds") List<Long> nodeIds) {
        this.periodKey = periodKey;
        this.nodeIds = nodeIds;
    }

    public Long getPeriodKey() {
        return periodKey;
    }

    public List<Long> getNodeIds() {
        return nodeIds;
    }
}
