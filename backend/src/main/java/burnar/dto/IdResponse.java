package burnar.dto;

/** Ответ create: новый people.id для выбора строки в BaseTable. */
public class IdResponse {

    private final Integer id;

    public IdResponse(Integer id) {
        this.id = id;
    }

    public Integer getId() {
        return id;
    }
}
