package burnar.dto;

import com.fasterxml.jackson.annotation.JsonCreator;
import com.fasterxml.jackson.annotation.JsonProperty;

/**
 * Вставка из каталога тематических разделов.
 * place: before | after | end | inside; mode: full | empty.
 */
public class NaryadCatalogInsertRequest {

    private final Long razdelId;
    private final String dateIn;
    private final String place;
    private final String mode;
    private final Long anchorNodeId;

    @JsonCreator
    public NaryadCatalogInsertRequest(
            @JsonProperty("razdelId") Long razdelId,
            @JsonProperty("dateIn") String dateIn,
            @JsonProperty("place") String place,
            @JsonProperty("mode") String mode,
            @JsonProperty("anchorNodeId") Long anchorNodeId) {
        this.razdelId = razdelId;
        this.dateIn = dateIn;
        this.place = place;
        this.mode = mode;
        this.anchorNodeId = anchorNodeId;
    }

    public Long getRazdelId() {
        return razdelId;
    }

    public String getDateIn() {
        return dateIn;
    }

    public String getPlace() {
        return place;
    }

    public String getMode() {
        return mode;
    }

    public Long getAnchorNodeId() {
        return anchorNodeId;
    }
}
