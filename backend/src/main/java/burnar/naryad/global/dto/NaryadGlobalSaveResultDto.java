package burnar.naryad.global.dto;

/** Что именно записалось. nameNar — наименование после нормализации, для заголовка карточки. */
public class NaryadGlobalSaveResultDto {

    private final String nameNar;
    private final boolean headerChanged;
    private final int paramsChanged;
    private final boolean checksChanged;

    public NaryadGlobalSaveResultDto(
            String nameNar, boolean headerChanged, int paramsChanged, boolean checksChanged) {
        this.nameNar = nameNar;
        this.headerChanged = headerChanged;
        this.paramsChanged = paramsChanged;
        this.checksChanged = checksChanged;
    }

    public String getNameNar() {
        return nameNar;
    }

    public boolean isHeaderChanged() {
        return headerChanged;
    }

    public int getParamsChanged() {
        return paramsChanged;
    }

    public boolean isChecksChanged() {
        return checksChanged;
    }
}
