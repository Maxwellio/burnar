package burnar.dto;

/**
 * Дата начала одной работы выполнения.
 * Чтение отдаёт {@code yyyy-MM-dd'T'HH:mm:ss} или null.
 * Запись отдаёт текст колонки дерева: дата без времени, если момент — полночь.
 */
public class NaryadFactDateDto {

    private final long id;
    private final String begoperdate;

    public NaryadFactDateDto(long id, String begoperdate) {
        this.id = id;
        this.begoperdate = begoperdate;
    }

    public long getId() {
        return id;
    }

    public String getBegoperdate() {
        return begoperdate;
    }
}
