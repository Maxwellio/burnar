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

    public static final String NOT_CONFIGURED =
            "Каталог оперкарт не настроен: burnar.ocards.dir пустой. "
                    + "Укажите папку через / и перезапустите backend.";
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
     * Файл внутри настроенного каталога. Пустой путь — «не настроен».
     * Путь задан, но папки нет — в тексте сам путь, который увидел процесс.
     * Ссылка, которая после раскрытия уходит из каталога, — 400.
     */
    public static Path resolve(String configuredDir, String fileName) {
        return resolve(configuredDir, fileName, Path.of(System.getProperty("user.dir")));
    }

    /**
     * Полный путь берётся как есть и не приклеивается к папке backend.
     * Относительный путь, когда процесс запущен из backend, считается от папки на уровень выше:
     * каталог оперкарт лежит рядом с модулем, а не внутри него.
     */
    static Path resolve(String configuredDir, String fileName, Path workingDirectory) {
        String dir = normalizeDir(configuredDir);
        if (dir.isEmpty()) {
            throw new ResponseStatusException(HttpStatus.SERVICE_UNAVAILABLE, NOT_CONFIGURED);
        }
        String safe = safeFileName(fileName);
        Path root = catalogRoot(dir, workingDirectory);
        if (!Files.isDirectory(root)) {
            throw new ResponseStatusException(HttpStatus.SERVICE_UNAVAILABLE, "Каталог оперкарт не найден: " + root);
        }
        try {
            root = root.toRealPath();
        } catch (IOException ex) {
            throw new ResponseStatusException(HttpStatus.SERVICE_UNAVAILABLE, "Каталог оперкарт недоступен: " + root);
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

    static Path catalogRoot(String dir, Path workingDirectory) {
        Path cwd = workingDirectory.toAbsolutePath().normalize();
        String unwrapped = unwrapDoubledAbsolute(dir, cwd);
        if (isAbsoluteLocation(unwrapped)) {
            return Path.of(unwrapped).normalize();
        }
        Path base = cwd;
        Path name = cwd.getFileName();
        boolean climbs = unwrapped.equals("..") || unwrapped.startsWith("../");
        if (!climbs && name != null && "backend".equalsIgnoreCase(name.toString()) && cwd.getParent() != null) {
            base = cwd.getParent();
        }
        return base.resolve(unwrapped).normalize();
    }

    /** «папка backend» + «C:/полный/путь» → «C:/полный/путь». */
    static String unwrapDoubledAbsolute(String dir, Path workingDirectory) {
        String text = dir.replace('\\', '/');
        String prefix = workingDirectory.toAbsolutePath().normalize().toString().replace('\\', '/');
        if (text.regionMatches(true, 0, prefix, 0, prefix.length())
                && text.length() > prefix.length()
                && text.charAt(prefix.length()) == '/') {
            String rest = text.substring(prefix.length() + 1);
            if (isAbsoluteLocation(rest)) {
                return rest;
            }
        }
        for (int i = 1; i < text.length() - 2; i++) {
            if (text.charAt(i - 1) == '/' && isWindowsDrive(text.substring(i))) {
                return text.substring(i);
            }
        }
        return dir;
    }

    static boolean isAbsoluteLocation(String dir) {
        String text = dir.replace('\\', '/');
        return isWindowsDrive(text) || text.startsWith("//") || text.startsWith("/") || Path.of(dir).isAbsolute();
    }

    private static boolean isWindowsDrive(String text) {
        return text.length() >= 3
                && Character.isLetter(text.charAt(0))
                && text.charAt(1) == ':'
                && text.charAt(2) == '/';
    }

    /** Кавычки и обратные слэши из Windows-пути не мешают открыть папку. */
    static String normalizeDir(String configuredDir) {
        if (configuredDir == null) {
            return "";
        }
        String dir = configuredDir.trim();
        if (dir.length() >= 2 && dir.startsWith("\"") && dir.endsWith("\"")) {
            dir = dir.substring(1, dir.length() - 1).trim();
        }
        return dir.replace('\\', '/');
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
