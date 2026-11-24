package burnar.naryad.color.controller;

import burnar.naryad.color.dto.NaryadRowColorDto;
import burnar.naryad.color.dto.NaryadRowColorRequest;
import burnar.naryad.color.dto.NaryadRowsColorDto;
import burnar.naryad.color.dto.NaryadRowsColorRequest;
import burnar.naryad.color.service.NaryadRowColorService;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

import java.util.LinkedHashMap;
import java.util.Map;

/**
 * Цвет строк наряда.
 * Пути остаются под /api/naryady.
 */
@RestController
@RequestMapping("/api/naryady")
public class NaryadRowColorController {

    private final NaryadRowColorService naryadRowColorService;

    public NaryadRowColorController(
            NaryadRowColorService naryadRowColorService) {
        this.naryadRowColorService = naryadRowColorService;
    }

    @PatchMapping("/{id:\\d+}/zadanie/{nodeId:\\d+}/color")
    public NaryadRowColorDto updateZadanieColor(
            @PathVariable int id,
            @PathVariable long nodeId,
            @RequestBody(required = false) NaryadRowColorRequest request) {
        return naryadRowColorService.updateZadanieColor(
                id, nodeId, request == null ? null : request.getColor());
    }

    @PatchMapping("/{id:\\d+}/zadanie/colors")
    public NaryadRowsColorDto updateZadanieColors(
            @PathVariable int id,
            @RequestBody(required = false) NaryadRowsColorRequest request) {
        return naryadRowColorService.updateZadanieColors(
                id,
                request == null ? null : request.getColor(),
                request == null ? null : request.getNodeIds());
    }

    @PatchMapping("/{id:\\d+}/vipolnenie/{nodeId:\\d+}/color")
    public NaryadRowColorDto updateVipolnenieColor(
            @PathVariable int id,
            @PathVariable long nodeId,
            @RequestBody(required = false) NaryadRowColorRequest request) {
        return naryadRowColorService.updateVipolnenieColor(
                id, nodeId, request == null ? null : request.getColor());
    }

    @PatchMapping("/{id:\\d+}/vipolnenie/colors")
    public NaryadRowsColorDto updateVipolnenieColors(
            @PathVariable int id,
            @RequestBody(required = false) NaryadRowsColorRequest request) {
        return naryadRowColorService.updateVipolnenieColors(
                id,
                request == null ? null : request.getColor(),
                request == null ? null : request.getNodeIds());
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
