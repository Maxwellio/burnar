package burnar.dto;

/** Что реально записано: от этого зависит, какие колонки дерева изменились. */
public class NaryadSkvSaveResultDto {

    private final boolean dateChanged;
    private final int paramsChanged;

    public NaryadSkvSaveResultDto(boolean dateChanged, int paramsChanged) {
        this.dateChanged = dateChanged;
        this.paramsChanged = paramsChanged;
    }

    public boolean isDateChanged() {
        return dateChanged;
    }

    public int getParamsChanged() {
        return paramsChanged;
    }
}
