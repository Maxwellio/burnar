package burnar.dto;

/** Признак блокировки одной работы выполнения. */
public class NaryadWorkLockDto {

    private final Long id;
    private final Integer locked;

    public NaryadWorkLockDto(Long id, Integer locked) {
        this.id = id;
        this.locked = locked;
    }

    public Long getId() {
        return id;
    }

    public Integer getLocked() {
        return locked;
    }
}
