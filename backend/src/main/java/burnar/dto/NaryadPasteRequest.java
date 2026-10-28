package burnar.dto;

import com.fasterxml.jackson.annotation.JsonCreator;
import com.fasterxml.jackson.annotation.JsonProperty;

import java.util.List;

/** Вставка снимка буфера перед строкой или внутрь пустого блока. */
public class NaryadPasteRequest {

    private final String mode;
    private final List<Long> nodeIds;
    private final Long targetId;
    private final String place;

    @JsonCreator
    public NaryadPasteRequest(
            @JsonProperty("mode") String mode,
            @JsonProperty("nodeIds") List<Long> nodeIds,
            @JsonProperty("targetId") Long targetId,
            @JsonProperty("place") String place) {
        this.mode = mode;
        this.nodeIds = nodeIds;
        this.targetId = targetId;
        this.place = place;
    }

    public String getMode() {
        return mode;
    }

    public List<Long> getNodeIds() {
        return nodeIds;
    }

    public Long getTargetId() {
        return targetId;
    }

    public String getPlace() {
        return place;
    }
}
