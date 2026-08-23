package burnar.dto;

/**
 * Тело POST/PUT /api/admin/positions.
 * Только наименование: rank в UI не показываем и не пишем (колонка в БД останется NULL при insert).
 * Валидация длины/пустоты — в PositionAdminService, не здесь.
 */
public class PositionWriteRequest {

    private String nm;

    public String getNm() {
        return nm;
    }

    public void setNm(String nm) {
        this.nm = nm;
    }
}
