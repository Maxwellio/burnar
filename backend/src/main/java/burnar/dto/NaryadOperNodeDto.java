package burnar.dto;

import com.fasterxml.jackson.annotation.JsonInclude;
import com.fasterxml.jackson.annotation.JsonProperty;

import java.math.BigDecimal;
import java.util.List;

/**
 * Узел дерева работ наряда для BaseTreeTable (Delphi trGrdNar).
 * id = zadanie_oper.key / vipolnenie_oper.key; children при ленивой загрузке не отдаём.
 */
public class NaryadOperNodeDto {

    private Long id;
    private Long parentId;
    private BigDecimal prnum;
    private String ord;
    private String nm;
    private String begoperdate;
    private String istnorm;
    private Integer oper;
    private BigDecimal ot;
    private BigDecimal do_;
    private BigDecimal n1;
    private BigDecimal n2;
    private Integer operlifeid;
    private Integer operlifetype;
    private Integer colorsel;
    private Integer locked;
    private Integer narkey;
    private String tipbur;
    private String rs;
    private BigDecimal fact;
    private Integer kor;
    private String periodNm;
    private Integer priznak;
    private boolean hasChildren;
    @JsonInclude(JsonInclude.Include.NON_NULL)
    private List<NaryadOperNodeDto> children;

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public Long getParentId() {
        return parentId;
    }

    public void setParentId(Long parentId) {
        this.parentId = parentId;
    }

    public BigDecimal getPrnum() {
        return prnum;
    }

    public void setPrnum(BigDecimal prnum) {
        this.prnum = prnum;
    }

    public String getOrd() {
        return ord;
    }

    public void setOrd(String ord) {
        this.ord = ord;
    }

    public String getNm() {
        return nm;
    }

    public void setNm(String nm) {
        this.nm = nm;
    }

    public String getBegoperdate() {
        return begoperdate;
    }

    public void setBegoperdate(String begoperdate) {
        this.begoperdate = begoperdate;
    }

    public String getIstnorm() {
        return istnorm;
    }

    public void setIstnorm(String istnorm) {
        this.istnorm = istnorm;
    }

    public Integer getOper() {
        return oper;
    }

    public void setOper(Integer oper) {
        this.oper = oper;
    }

    public BigDecimal getOt() {
        return ot;
    }

    public void setOt(BigDecimal ot) {
        this.ot = ot;
    }

    @JsonProperty("do_")
    public BigDecimal getDo_() {
        return do_;
    }

    @JsonProperty("do_")
    public void setDo_(BigDecimal do_) {
        this.do_ = do_;
    }

    public BigDecimal getN1() {
        return n1;
    }

    public void setN1(BigDecimal n1) {
        this.n1 = n1;
    }

    public BigDecimal getN2() {
        return n2;
    }

    public void setN2(BigDecimal n2) {
        this.n2 = n2;
    }

    public Integer getOperlifeid() {
        return operlifeid;
    }

    public void setOperlifeid(Integer operlifeid) {
        this.operlifeid = operlifeid;
    }

    public Integer getOperlifetype() {
        return operlifetype;
    }

    public void setOperlifetype(Integer operlifetype) {
        this.operlifetype = operlifetype;
    }

    public Integer getColorsel() {
        return colorsel;
    }

    public void setColorsel(Integer colorsel) {
        this.colorsel = colorsel;
    }

    public Integer getLocked() {
        return locked;
    }

    public void setLocked(Integer locked) {
        this.locked = locked;
    }

    public Integer getNarkey() {
        return narkey;
    }

    public void setNarkey(Integer narkey) {
        this.narkey = narkey;
    }

    public String getTipbur() {
        return tipbur;
    }

    public void setTipbur(String tipbur) {
        this.tipbur = tipbur;
    }

    public String getRs() {
        return rs;
    }

    public void setRs(String rs) {
        this.rs = rs;
    }

    public BigDecimal getFact() {
        return fact;
    }

    public void setFact(BigDecimal fact) {
        this.fact = fact;
    }

    public Integer getKor() {
        return kor;
    }

    public void setKor(Integer kor) {
        this.kor = kor;
    }

    @JsonProperty("period_nm")
    public String getPeriodNm() {
        return periodNm;
    }

    @JsonProperty("period_nm")
    public void setPeriodNm(String periodNm) {
        this.periodNm = periodNm;
    }

    public Integer getPriznak() {
        return priznak;
    }

    public void setPriznak(Integer priznak) {
        this.priznak = priznak;
    }

    public boolean getHasChildren() {
        return hasChildren;
    }

    public void setHasChildren(boolean hasChildren) {
        this.hasChildren = hasChildren;
    }

    public List<NaryadOperNodeDto> getChildren() {
        return children;
    }

    public void setChildren(List<NaryadOperNodeDto> children) {
        this.children = children;
    }
}
