package burnar.dto;

import java.math.BigDecimal;

/** Новое значение параметра операции. null очищает ячейку. */
public class NaryadOperParamValueRequest {

    private BigDecimal value;

    public BigDecimal getValue() {
        return value;
    }

    public void setValue(BigDecimal value) {
        this.value = value;
    }
}
