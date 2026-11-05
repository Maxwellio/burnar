package burnar.dto;

/** Имя HTML-оперкарты из public.istochniki.lnkfile. */
public class NaryadOcardFileDto {

    private String fileName;

    public NaryadOcardFileDto() {
    }

    public NaryadOcardFileDto(String fileName) {
        this.fileName = fileName;
    }

    public String getFileName() {
        return fileName;
    }

    public void setFileName(String fileName) {
        this.fileName = fileName;
    }
}
