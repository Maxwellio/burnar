package burnar.dto;

/**
 * Текст алгоритма (Delphi algInfo ← qrAlgInfo / public.algs.ops).
 * Пустая строка, если строка не тип 80 или алгоритма нет.
 */
public class NaryadAlgorithmDto {

    private String text;

    public NaryadAlgorithmDto() {
        this.text = "";
    }

    public NaryadAlgorithmDto(String text) {
        this.text = text == null ? "" : text;
    }

    public static NaryadAlgorithmDto empty() {
        return new NaryadAlgorithmDto("");
    }

    public String getText() {
        return text;
    }

    public void setText(String text) {
        this.text = text == null ? "" : text;
    }
}
