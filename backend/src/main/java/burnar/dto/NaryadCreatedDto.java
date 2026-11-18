package burnar.dto;

/** Код наряда, который вернула burnar.createnar. */
public class NaryadCreatedDto {

    private final int id;

    public NaryadCreatedDto(int id) {
        this.id = id;
    }

    public int getId() {
        return id;
    }
}
