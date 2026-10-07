package burnar.dto;

import com.fasterxml.jackson.annotation.JsonCreator;
import com.fasterxml.jackson.annotation.JsonProperty;

public class NaryadClosedRequest {

    private final Boolean closed;

    @JsonCreator
    public NaryadClosedRequest(@JsonProperty("closed") Boolean closed) {
        this.closed = closed;
    }

    public Boolean getClosed() {
        return closed;
    }
}
