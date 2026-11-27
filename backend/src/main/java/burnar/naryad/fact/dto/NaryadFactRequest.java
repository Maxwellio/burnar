package burnar.naryad.fact.dto;

import com.fasterxml.jackson.annotation.JsonCreator;
import com.fasterxml.jackson.annotation.JsonProperty;

import java.math.BigDecimal;

/** Часы с экрана. {@code null} очищает факт. */
public class NaryadFactRequest {

    private final BigDecimal fact;

    @JsonCreator
    public NaryadFactRequest(@JsonProperty("fact") BigDecimal fact) {
        this.fact = fact;
    }

    public BigDecimal getFact() {
        return fact;
    }
}
