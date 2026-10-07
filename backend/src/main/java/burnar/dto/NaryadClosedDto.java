package burnar.dto;

import com.fasterxml.jackson.annotation.JsonProperty;

public class NaryadClosedDto {

    private final boolean closed;

    public NaryadClosedDto(boolean closed) {
        this.closed = closed;
    }

    @JsonProperty("closed")
    public boolean isClosed() {
        return closed;
    }
}
