package burnar.dto;

import com.fasterxml.jackson.annotation.JsonInclude;
import com.fasterxml.jackson.annotation.JsonProperty;

import java.util.List;

/** Ответ расчёта операции. rebuilt — расчёт не выполнялся, дерево нужно перечитать. */
@JsonInclude(JsonInclude.Include.NON_NULL)
public class NaryadCalcResultDto {

    private final boolean rebuilt;
    private final NaryadCalcNodeDto node;
    private final List<NaryadCalcDateDto> dates;

    public NaryadCalcResultDto(boolean rebuilt, NaryadCalcNodeDto node, List<NaryadCalcDateDto> dates) {
        this.rebuilt = rebuilt;
        this.node = node;
        this.dates = dates;
    }

    public static NaryadCalcResultDto rebuilt() {
        return new NaryadCalcResultDto(true, null, null);
    }

    @JsonProperty("rebuilt")
    public boolean isRebuilt() {
        return rebuilt;
    }

    public NaryadCalcNodeDto getNode() {
        return node;
    }

    public List<NaryadCalcDateDto> getDates() {
        return dates;
    }
}
