package burnar.dto;

import com.fasterxml.jackson.annotation.JsonProperty;

import java.math.BigDecimal;

/**
 * Ответ сохранения параметра. changed — норма и источник сброшены,
 * n1/n2/istnorm тогда пустые и клиент затирает их в строке дерева.
 */
public class NaryadOperParamSaveDto {

    private final boolean changed;
    private final Long id;
    private final BigDecimal n1;
    private final BigDecimal n2;
    private final String istnorm;

    public NaryadOperParamSaveDto(boolean changed, Long id, BigDecimal n1, BigDecimal n2, String istnorm) {
        this.changed = changed;
        this.id = id;
        this.n1 = n1;
        this.n2 = n2;
        this.istnorm = istnorm;
    }

    public static NaryadOperParamSaveDto unchanged(long nodeId) {
        return new NaryadOperParamSaveDto(false, nodeId, null, null, null);
    }

    public static NaryadOperParamSaveDto cleared(long nodeId) {
        return new NaryadOperParamSaveDto(true, nodeId, null, null, null);
    }

    @JsonProperty("changed")
    public boolean isChanged() {
        return changed;
    }

    public Long getId() {
        return id;
    }

    public BigDecimal getN1() {
        return n1;
    }

    public BigDecimal getN2() {
        return n2;
    }

    public String getIstnorm() {
        return istnorm;
    }
}
