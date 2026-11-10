package burnar.dto;

import com.fasterxml.jackson.annotation.JsonCreator;
import com.fasterxml.jackson.annotation.JsonProperty;

public class NaryadPeriodWriteRequest {

    private final String nm;
    private final String begoperdate;
    private final String outoperdate;

    @JsonCreator
    public NaryadPeriodWriteRequest(
            @JsonProperty("nm") String nm,
            @JsonProperty("begoperdate") String begoperdate,
            @JsonProperty("outoperdate") String outoperdate) {
        this.nm = nm;
        this.begoperdate = begoperdate;
        this.outoperdate = outoperdate;
    }

    public String getNm() {
        return nm;
    }

    public String getBegoperdate() {
        return begoperdate;
    }

    public String getOutoperdate() {
        return outoperdate;
    }
}
