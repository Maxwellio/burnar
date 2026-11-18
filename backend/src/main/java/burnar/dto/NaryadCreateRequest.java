package burnar.dto;

import com.fasterxml.jackson.annotation.JsonCreator;
import com.fasterxml.jackson.annotation.JsonProperty;

/** Создание наряда со списка: бригада обязательна, имя и дата начала — нет. */
public class NaryadCreateRequest {

    private final Integer ownerNar;
    private final String nameNar;
    private final String begDate;

    @JsonCreator
    public NaryadCreateRequest(
            @JsonProperty("ownerNar") Integer ownerNar,
            @JsonProperty("nameNar") String nameNar,
            @JsonProperty("begDate") String begDate) {
        this.ownerNar = ownerNar;
        this.nameNar = nameNar;
        this.begDate = begDate;
    }

    public Integer getOwnerNar() {
        return ownerNar;
    }

    public String getNameNar() {
        return nameNar;
    }

    public String getBegDate() {
        return begDate;
    }
}
