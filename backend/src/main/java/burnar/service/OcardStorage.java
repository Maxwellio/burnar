package burnar.service;

import org.springframework.http.HttpStatus;
import org.springframework.web.server.ResponseStatusException;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.Locale;
import java.util.Set;

/**
 * Каталог HTML-оперкарт на сервере приложения. Имя файла приходит из
 * public.istochniki.lnkfile и не должно выходить из каталога.
 * Содержимое htm — windows-1251, как у карт, которые открывал Internet Explorer.
 */
public final class OcardStorage {

    public static final String NOT_CONFIGURED = "Каталог оперкарт не настроен";
    public static final String BAD_NAME = "Недопустимое имя файла оперкарты";
    public static final String HTML_MEDIA_TYPE = "text/html;charset=windows-1251";
    public static final String CONTENT_SECURITY_POLICY =
            "default-src 'none'; img-src 'self'; style-src 'self' 'unsafe-inline'; "
                    + "font-src 'self'; base-uri 'none'; form-action 'none'";

    private static final Set<String> ALLOWED = Set.of(
            "htm", "html", "gif", "jpg", "jpeg", "png", "bmp", "css", "ico");

    private OcardStorage() {
    }

    public static String safeFileName(String fileName) {
        if (fileName == null) {
            throw badName();
        }
        String name = fileName.trim();
        if (name.isEmpty() || ".".equals(name) || "..".equals(name)) {
            throw badName();
        }
        if (name.indexOf('/') >= 0 || name.indexOf('\\') >= 0 || name.indexOf('\0') >= 0 || name.contains("..")) {
            throw badName();
        }
        String ext = extension(name);
        if (ext.isEmpty() || !ALLOWED.contains(ext)) {
            throw badName();
        }
        return name;
    }

    public static String mediaType(String fileName) {
        String ext = extension(safeFileName(fileName));
        switch (ext) {
            case "htm":
            case "html":
                return HTML_MEDIA_TYPE;
            case "css":
                return "text/css;charset=windows-1251";
            case "gif":
                return "image/gif";
            case "jpg":
            case "jpeg":
                return "image/jpeg";
            case "png":
                return "image/png";
            case "bmp":
                return "image/bmp";
            case "ico":
                return "image/x-icon";
            default:
                throw badName();
        }
    }

    /**
     * Файл внутри настроенного каталога. Пустой путь и отсутствующий каталог — 503.
     * Ссылка, которая после раскрытия уходит из каталога, — 400.
     */
    public static Path resolve(String configuredDir, String fileName) {
        if (configuredDir == null || configuredDir.isBlank()) {
            throw new ResponseStatusException(HttpStatus.SERVICE_UNAVAILABLE, NOT_CONFIGURED);
        }
        String safe = safeFileName(fileName);
        Path root;
        try {
            root = Path.of(configuredDir).toAbsolutePath().normalize().toRealPath();
        } catch (IOException ex) {
            throw new ResponseStatusException(HttpStatus.SERVICE_UNAVAILABLE, NOT_CONFIGURED);
        }
        if (!Files.isDirectory(root)) {
            throw new ResponseStatusException(HttpStatus.SERVICE_UNAVAILABLE, NOT_CONFIGURED);
        }
        Path file = root.resolve(safe).normalize();
        if (!file.startsWith(root)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, BAD_NAME);
        }
        if (!Files.isRegularFile(file)) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, missing(safe));
        }
        try {
            Path real = file.toRealPath();
            if (!real.startsWith(root)) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, BAD_NAME);
            }
            return real;
        } catch (ResponseStatusException ex) {
            throw ex;
        } catch (IOException ex) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, missing(safe));
        }
    }

    private static String extension(String name) {
        int dot = name.lastIndexOf('.');
        if (dot <= 0 || dot == name.length() - 1) {
            return "";
        }
        return name.substring(dot + 1).toLowerCase(Locale.ROOT);
    }

    private static String missing(String safe) {
        return "Файл оперкарты не найден: " + safe;
    }

    private static ResponseStatusException badName() {
        return new ResponseStatusException(HttpStatus.BAD_REQUEST, BAD_NAME);
    }
}
