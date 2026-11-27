package burnar.naryad.fact.controller;

import burnar.naryad.fact.dto.NaryadFactDto;
import burnar.naryad.fact.dto.NaryadFactRequest;
import burnar.naryad.fact.service.NaryadFactService;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

import java.util.LinkedHashMap;
import java.util.Map;

/**
 * Ввод факта работы выполнения.
 * Путь остаётся под /api/naryady.
 */
@RestController
@RequestMapping("/api/naryady")
public class NaryadFactController {

    private final NaryadFactService naryadFactService;

    public NaryadFactController(NaryadFactService naryadFactService) {
        this.naryadFactService = naryadFactService;
    }

    @PutMapping("/{id:\\d+}/vipolnenie/nodes/{nodeId:\\d+}/fact")
    public NaryadFactDto setVipolnenieFact(
            @PathVariable int id,
            @PathVariable long nodeId,
            @RequestBody(required = false) NaryadFactRequest request) {
        return naryadFactService.update(id, nodeId, request);
    }

    /**
     * Boot 2.7 по умолчанию скрывает message в JSON — без этого диалог
     * покажет только «Request failed: 409».
     */
    @ExceptionHandler(ResponseStatusException.class)
    public ResponseEntity<Map<String, Object>> handleStatus(ResponseStatusException ex) {
        Map<String, Object> body = new LinkedHashMap<>();
        HttpStatus status = ex.getStatus();
        body.put("status", status.value());
        body.put("message", ex.getReason() != null ? ex.getReason() : status.getReasonPhrase());
        return ResponseEntity.status(status).body(body);
    }
}
