package burnar.dto;

/**
 * Период выполнения: название и границы с секундами, как поля формы Delphi.
 */
public class NaryadPeriodDto {

    private final long key;
    private final String nm;
    private final String begoperdate;
    private final String outoperdate;

    public NaryadPeriodDto(long key, String nm, String begoperdate, String outoperdate) {
        this.key = key;
        this.nm = nm;
        this.begoperdate = begoperdate;
        this.outoperdate = outoperdate;
    }

    public long getKey() {
        return key;
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
