package burnar.controller;

import burnar.config.BurnarProperties;
import burnar.service.OcardStorage;
import org.springframework.core.io.FileSystemResource;
import org.springframework.core.io.Resource;
import org.springframework.http.CacheControl;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

import java.nio.file.Path;
import java.util.LinkedHashMap;
import java.util.Map;

/**
 * Файлы оперкарт и картинки рядом с ними. Адрес под /api, поэтому без сессии не отдаётся.
 */
@RestController
@RequestMapping("/api/ocards")
public class OcardFileController {

    private final BurnarProperties properties;

    public OcardFileController(BurnarProperties properties) {
        this.properties = properties;
    }

    @GetMapping("/files/{fileName:.+}")
    public ResponseEntity<Resource> file(@PathVariable String fileName) {
        Path path = OcardStorage.resolve(properties.getOcardsDir(), fileName);
        return ResponseEntity.ok()
                .contentType(MediaType.parseMediaType(OcardStorage.mediaType(path.getFileName().toString())))
                .header("Content-Security-Policy", OcardStorage.CONTENT_SECURITY_POLICY)
                .header("X-Content-Type-Options", "nosniff")
                .cacheControl(CacheControl.noCache())
                .body(new FileSystemResource(path));
    }

    @ExceptionHandler(ResponseStatusException.class)
    public ResponseEntity<Map<String, Object>> handleStatus(ResponseStatusException ex) {
        Map<String, Object> body = new LinkedHashMap<>();
        HttpStatus status = ex.getStatus();
        body.put("status", status.value());
        body.put("message", ex.getReason() != null ? ex.getReason() : status.getReasonPhrase());
        return ResponseEntity.status(status).body(body);
    }
}
