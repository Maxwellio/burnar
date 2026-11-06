package burnar.dto;

import java.math.BigDecimal;

/**
 * Одна строка итогов по периоду выполнения, как Delphi qrITOGtable.
 * Часы уже округлены запросом. Пустое число остаётся null.
 */
public class NaryadPeriodTotalDto {

    private Long periodKey;
    private String name;
    private BigDecimal summN;
    private BigDecimal summF;
    private BigDecimal normativ;
    private BigDecimal remontN;
    private BigDecimal fact;
    private BigDecimal remontF;

    public Long getPeriodKey() {
        return periodKey;
    }

    public void setPeriodKey(Long periodKey) {
        this.periodKey = periodKey;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public BigDecimal getSummN() {
        return summN;
    }

    public void setSummN(BigDecimal summN) {
        this.summN = summN;
    }

    public BigDecimal getSummF() {
        return summF;
    }

    public void setSummF(BigDecimal summF) {
        this.summF = summF;
    }

    public BigDecimal getNormativ() {
        return normativ;
    }

    public void setNormativ(BigDecimal normativ) {
        this.normativ = normativ;
    }

    public BigDecimal getRemontN() {
        return remontN;
    }

    public void setRemontN(BigDecimal remontN) {
        this.remontN = remontN;
    }

    public BigDecimal getFact() {
        return fact;
    }

    public void setFact(BigDecimal fact) {
        this.fact = fact;
    }

    public BigDecimal getRemontF() {
        return remontF;
    }

    public void setRemontF(BigDecimal remontF) {
        this.remontF = remontF;
    }
}
