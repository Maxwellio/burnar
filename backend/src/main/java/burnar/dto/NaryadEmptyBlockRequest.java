package burnar.dto;

import com.fasterxml.jackson.annotation.JsonCreator;
import com.fasterxml.jackson.annotation.JsonProperty;

/** Пустой блок перед выбранной строкой. Пустое имя допустимо. */
public class NaryadEmptyBlockRequest {

    private final Long beforeNodeId;
    private final String name;

    @JsonCreator
    public NaryadEmptyBlockRequest(
            @JsonProperty("beforeNodeId") Long beforeNodeId,
            @JsonProperty("name") String name) {
        this.beforeNodeId = beforeNodeId;
        this.name = name;
    }

    public Long getBeforeNodeId() {
        return beforeNodeId;
    }

    public String getName() {
        return name;
    }
}
