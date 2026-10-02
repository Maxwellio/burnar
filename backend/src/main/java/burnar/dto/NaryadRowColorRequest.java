package burnar.dto;

import com.fasterxml.jackson.annotation.JsonCreator;
import com.fasterxml.jackson.annotation.JsonProperty;

public class NaryadRowColorRequest {

    private Integer color;

    @JsonCreator
    public NaryadRowColorRequest(@JsonProperty("color") Integer color) {
        this.color = color;
    }

    public NaryadRowColorRequest() {
    }

    public Integer getColor() {
        return color;
    }

    public void setColor(Integer color) {
        this.color = color;
    }
}
