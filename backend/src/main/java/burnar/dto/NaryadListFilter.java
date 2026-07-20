package burnar.dto;

/**
 * Query-параметры фильтров колонок BaseTable для GET /api/naryady.
 * Имена совпадают с id/accessorKey колонок на фронте (naryadColumns.js).
 * Даты приходят как YYYY-MM-DDTHH:mm:ss из DynamicDatePicker.
 * Пустые значения на бэке игнорируются.
 */
public class NaryadListFilter {

    private String codNar;
    private String nameNar;
    private String ownerNar;
    private String masterNar;
    /** Дата планового начала бурения (колонка показывает begDate). */
    private String zadClose;
    /** Текст учётных периодов (колонка показывает perVip). */
    private String vipClose;
    private String vipBegDate;
    private String skv;
    private String kust;
    private String mest;
    private String dateCreate;
    private String autorNar;

    public String getCodNar() {
        return codNar;
    }

    public void setCodNar(String codNar) {
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
