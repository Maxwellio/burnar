package burnar.dto;

import com.fasterxml.jackson.annotation.JsonInclude;

/** Новое время начала работы из burnar.tkeydate после SetNextDateOper. */
@JsonInclude(JsonInclude.Include.NON_NULL)
public class NaryadCalcDateDto {

    private final Long id;
    private final String begoperdate;

    public NaryadCalcDateDto(Long id, String begoperdate) {
        this.id = id;
        this.begoperdate = begoperdate;
    }

    public Long getId() {
        return id;
    }

    public String getBegoperdate() {
        return begoperdate;
    }
}
