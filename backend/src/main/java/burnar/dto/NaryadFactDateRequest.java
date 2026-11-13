package burnar.dto;

import com.fasterxml.jackson.annotation.JsonCreator;
import com.fasterxml.jackson.annotation.JsonProperty;

public class NaryadFactDateRequest {

    private final String begoperdate;

    @JsonCreator
    public NaryadFactDateRequest(@JsonProperty("begoperdate") String begoperdate) {
        this.begoperdate = begoperdate;
    }

    public String getBegoperdate() {
        return begoperdate;
    }
}
