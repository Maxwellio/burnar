package burnar.dto;

import com.fasterxml.jackson.annotation.JsonCreator;
import com.fasterxml.jackson.annotation.JsonProperty;

/** Пустой блок перед выбранной строкой. Пустое имя допустимо. */
public class NaryadEmptyBlockRequest {

    private final Long beforeNodeId;
    private final String name;
    private final String place;

    @JsonCreator
    public NaryadEmptyBlockRequest(
            @JsonProperty("beforeNodeId") Long beforeNodeId,
            @JsonProperty("name") String name,
            @JsonProperty("place") String place) {
        this.beforeNodeId = beforeNodeId;
        this.name = name;
        this.place = place;
    }

    public Long getBeforeNodeId() {
        return beforeNodeId;
    }

    public String getName() {
        return name;
    }

    public String getPlace() {
        return place;
    }
}
