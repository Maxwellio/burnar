package burnar.dto;

/**
 * Строка списка нарядов бурения — поля как в Delphi NarListUnit (grdDefNarList).
 * id дублирует codNar: BaseTable берёт row.original.id при выборе/даблклике.
 */
public class NaryadListDto {

    private Integer id;
    private Integer codNar;
    private String nameNar;
    private String ownerNar;
    private String masterNar;
    /** 1 — задание закрыто, 0 — открыто, null — нет записи defnarzad */
    private String zadClose;
    /** 1 — выполнение закрыто, 0 — открыто, null — нет записи defnarvip */
    private String vipClose;
    private String vipBegDate;
    private String perVip;
    private String begDate;
    private String skv;
    private String kust;
    private String mest;
    private String dateCreate;
    private String autorNar;

    public Integer getId() {
        return id;
    }

    public void setId(Integer id) {
        this.id = id;
    }

    public Integer getCodNar() {
        return codNar;
    }

    public void setCodNar(Integer codNar) {
        this.codNar = codNar;
    }

    public String getNameNar() {
        return nameNar;
    }

    public void setNameNar(String nameNar) {
        this.nameNar = nameNar;
    }

    public String getOwnerNar() {
        return ownerNar;
    }

    public void setOwnerNar(String ownerNar) {
        this.ownerNar = ownerNar;
    }

    public String getMasterNar() {
        return masterNar;
    }

    public void setMasterNar(String masterNar) {
        this.masterNar = masterNar;
    }

    public String getZadClose() {
        return zadClose;
    }

    public void setZadClose(String zadClose) {
        this.zadClose = zadClose;
    }

    public String getVipClose() {
        return vipClose;
    }

    public void setVipClose(String vipClose) {
        this.vipClose = vipClose;
    }

    public String getVipBegDate() {
        return vipBegDate;
    }

    public void setVipBegDate(String vipBegDate) {
        this.vipBegDate = vipBegDate;
    }

    public String getPerVip() {
        return perVip;
    }

    public void setPerVip(String perVip) {
        this.perVip = perVip;
    }

    public String getBegDate() {
        return begDate;
    }

    public void setBegDate(String begDate) {
        this.begDate = begDate;
    }

    public String getSkv() {
        return skv;
    }

    public void setSkv(String skv) {
        this.skv = skv;
    }

    public String getKust() {
        return kust;
    }

    public void setKust(String kust) {
        this.kust = kust;
    }

    public String getMest() {
        return mest;
    }

    public void setMest(String mest) {
        this.mest = mest;
    }

    public String getDateCreate() {
        return dateCreate;
    }

    public void setDateCreate(String dateCreate) {
        this.dateCreate = dateCreate;
    }

    public String getAutorNar() {
        return autorNar;
    }

    public void setAutorNar(String autorNar) {
        this.autorNar = autorNar;
    }
}
