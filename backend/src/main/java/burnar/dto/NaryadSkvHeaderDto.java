package burnar.dto;

/**
 * Шапка окна сквозных параметров: дата начала работ и состояние закрытия описателя.
 * begDate — {@code yyyy-MM-dd'T'HH:mm:ss}, closedDate — {@code dd.MM.yyyy HH:mm:ss}.
 * readOnlyReason не пустой, когда правка запрещена.
 */
public class NaryadSkvHeaderDto {

    private final String begDate;
    private final boolean closed;
    private final String closedDate;
    private final String readOnlyReason;

    public NaryadSkvHeaderDto(String begDate, boolean closed, String closedDate, String readOnlyReason) {
        this.begDate = begDate;
        this.closed = closed;
        this.closedDate = closedDate;
        this.readOnlyReason = readOnlyReason;
    }

    public String getBegDate() {
        return begDate;
    }

    public boolean isClosed() {
        return closed;
    }

    public String getClosedDate() {
        return closedDate;
    }

    public boolean isReadOnly() {
        return readOnlyReason != null;
    }

    public String getReadOnlyReason() {
        return readOnlyReason;
    }
}
