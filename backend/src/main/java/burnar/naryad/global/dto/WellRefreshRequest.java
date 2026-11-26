package burnar.naryad.global.dto;

import com.fasterxml.jackson.annotation.JsonProperty;

/** Техместо для {@code public.getkustwell}. */
public class WellRefreshRequest {

    private final String tehmesto;

    public WellRefreshRequest(@JsonProperty("tehmesto") String tehmesto) {
        this.tehmesto = tehmesto;
    }

    public String getTehmesto() {
        return tehmesto;
    }
}
