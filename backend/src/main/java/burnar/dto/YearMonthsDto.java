package burnar.dto;

import java.util.List;

/**
 * Узел дерева месяцев для DynamicDateList: год + месяцы с данными.
 * month — строки "1"…"12" (как ожидает компонент mainComponent).
 */
public class YearMonthsDto {

    private int year;
    private List<String> month;

    public YearMonthsDto() {
    }

    public YearMonthsDto(int year, List<String> month) {
        this.year = year;
        this.month = month;
    }

    public int getYear() {
        return year;
    }

    public void setYear(int year) {
        this.year = year;
    }

    public List<String> getMonth() {
        return month;
    }

    public void setMonth(List<String> month) {
        this.month = month;
    }
}
