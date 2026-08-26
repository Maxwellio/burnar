package burnar.dto;

/**
 * Ответ предпроверки удаления: если blocked — фронт показывает предупреждение без «Удалить».
 */
public class DeleteBlockDto {

    private boolean blocked;
    private String message;

    public static DeleteBlockDto allowed() {
        DeleteBlockDto dto = new DeleteBlockDto();
        dto.setBlocked(false);
        return dto;
    }

    public static DeleteBlockDto blocked(String message) {
        DeleteBlockDto dto = new DeleteBlockDto();
        dto.setBlocked(true);
        dto.setMessage(message);
        return dto;
    }

    public boolean isBlocked() {
        return blocked;
    }

    public void setBlocked(boolean blocked) {
        this.blocked = blocked;
    }

    public String getMessage() {
        return message;
    }

    public void setMessage(String message) {
        this.message = message;
    }
}
