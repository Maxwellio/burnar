package burnar.naryad.factdate.controller;

import burnar.naryad.factdate.dto.NaryadFactDateDto;
import burnar.naryad.factdate.dto.NaryadFactDateRequest;
import burnar.naryad.factdate.service.NaryadFactDateService;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

import java.util.LinkedHashMap;
import java.util.Map;

/**
 * Фактическая дата начала работы.
 * Пути остаются под /api/naryady.
 */
@RestController
@RequestMapping("/api/naryady")
public class NaryadFactDateController {

    private final NaryadFactDateService naryadFactDateService;

    public NaryadFactDateController(
            NaryadFactDateService naryadFactDateService) {
        this.naryadFactDateService = naryadFactDateService;
    }

    @GetMapping("/{id:\\d+}/vipolnenie/nodes/{nodeId:\\d+}/begoperdate")
    public NaryadFactDateDto vipolnenieBegoperdate(@PathVariable int id, @PathVariable long nodeId) {
        return naryadFactDateService.read(id, nodeId);
    }

    @PutMapping("/{id:\\d+}/vipolnenie/nodes/{nodeId:\\d+}/begoperdate")
    public NaryadFactDateDto setVipolnenieBegoperdate(
            @PathVariable int id,
            @PathVariable long nodeId,
            @RequestBody(required = false) NaryadFactDateRequest request) {
        return naryadFactDateService.update(id, nodeId, request);
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
