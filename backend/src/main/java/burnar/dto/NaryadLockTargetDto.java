package burnar.dto;

/** Строка, которую сервер передал в процедуру блокировки или разблокировки. */
public class NaryadLockTargetDto {

    private final Long nodeId;

    public NaryadLockTargetDto(Long nodeId) {
        this.nodeId = nodeId;
    }

    public Long getNodeId() {
        return nodeId;
    }
}
