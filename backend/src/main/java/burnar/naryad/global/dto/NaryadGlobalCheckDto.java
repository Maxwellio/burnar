package burnar.naryad.global.dto;

/** Пункт нижнего списка: тип скважины или параметр отчёта. */
public class NaryadGlobalCheckDto {

    private final int id;
    private final String name;
    private final boolean checked;

    public NaryadGlobalCheckDto(int id, String name, boolean checked) {
        this.id = id;
        this.name = name;
        this.checked = checked;
    }

    public int getId() {
        return id;
    }

    public String getName() {
        return name;
    }

    public boolean isChecked() {
        return checked;
    }
}
